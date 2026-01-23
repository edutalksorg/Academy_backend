const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { TestCase } = require('../models');
const os = require('os');

const TIMEOUT_MS = 5000; // 5 seconds timeout

async function runCode({ language, code, input }) {
    return new Promise((resolve, reject) => {
        const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const tempDir = path.join(os.tmpdir(), 'academy_run', uniqueId);

        // Ensure parent temp dir exists
        const parentDir = path.join(os.tmpdir(), 'academy_run');
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir);
        }

        // Create isolated directory for this run
        fs.mkdirSync(tempDir);

        let fileName;
        let command;

        if (language === 'java') {
            fileName = 'Main.java'; // Java usually requires class name to match file. We enforce Main.
            command = `javac "${path.join(tempDir, fileName)}" && java -cp "${tempDir}" Main`;
        } else {
            fileName = `solution.${language === 'python' ? 'py' : 'js'}`;
            const filePath = path.join(tempDir, fileName);
            command = language === 'python' ? `python "${filePath}"` : `node "${filePath}"`;
        }

        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, code);

        console.log(`[${uniqueId}] Executing command: ${command}`);
        const child = exec(command, { timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
            // Cleanup: delete the unique directory
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {
                console.error("Failed to cleanup temp dir:", e);
            }

            if (error && error.signal === 'SIGTERM') {
                console.log(`[${uniqueId}] Time Limit Exceeded`);
                return resolve({ success: false, error: 'Time Limit Exceeded' });
            }

            if (error) {
                console.log(`[${uniqueId}] Execution Error:`, error.message);
                if (stderr) console.log(`[${uniqueId}] Stderr:`, stderr.toString());
                return resolve({ success: false, error: stderr ? stderr.toString() : error.message });
            }

            if (stderr && language !== 'java') {
                console.log(`[${uniqueId}] Stderr Warning:`, stderr.toString());
                return resolve({ success: false, error: stderr.toString() });
            }

            console.log(`[${uniqueId}] Success. Output:`, stdout.toString().trim());
            resolve({ success: true, output: stdout.toString().trim() });
        });

        // Provide input to stdin
        if (input) {
            console.log(`[${uniqueId}] Writing input to stdin: ${input.substring(0, 50)}...`);
            child.stdin.write(input);
            child.stdin.end();
        } else {
            console.log(`[${uniqueId}] No input provided`);
        }
    });
}

async function submitSolution({ questionId, code, language }) {
    const testCases = await TestCase.findAll({ where: { questionId } });

    if (!testCases || testCases.length === 0) {
        return { allPassed: false, results: [], error: 'No test cases found for this question.' };
    }

    const results = [];
    let allPassed = true;

    for (const tc of testCases) {
        const result = await runCode({ language, code, input: tc.input });

        const passed = result.success && result.output === tc.expectedOutput.trim();
        if (!passed) allPassed = false;

        results.push({
            testCaseId: tc.id,
            input: tc.input,
            expected: tc.expectedOutput,
            explanation: tc.explanation, // Return explanation
            actual: result.output,
            error: result.error,
            passed,
            isPublic: tc.isPublic
        });
    }

    return { allPassed, results };
}

module.exports = { runCode, submitSolution };
