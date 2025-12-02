const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');
const logger = require('../config/logger');

let sequelize;
if (config.db.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.db.storage || './database.sqlite',
    logging: (msg) => logger.info(msg)
  });
} else {
  sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: config.db.dialect,
      logging: (msg) => logger.info(msg)
    }
  );
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user.model')(sequelize, DataTypes);
db.College = require('./college.model')(sequelize, DataTypes);
db.Test = require('./test.model')(sequelize, DataTypes);
db.Question = require('./question.model')(sequelize, DataTypes);
db.Option = require('./option.model')(sequelize, DataTypes);
db.Attempt = require('./attempt.model')(sequelize, DataTypes);
db.AttemptAnswer = require('./attemptAnswer.model')(sequelize, DataTypes);

// Associations
db.College.hasMany(db.User, { foreignKey: 'collegeId' });
db.User.belongsTo(db.College, { foreignKey: 'collegeId' });

db.User.hasMany(db.Test, { foreignKey: 'instructorId' });
db.Test.belongsTo(db.User, { as: 'instructor', foreignKey: 'instructorId' });

db.Test.hasMany(db.Question, { foreignKey: 'testId', onDelete: 'cascade' });
db.Question.belongsTo(db.Test, { foreignKey: 'testId' });

db.Question.hasMany(db.Option, { foreignKey: 'questionId', onDelete: 'cascade' });
db.Option.belongsTo(db.Question, { foreignKey: 'questionId' });

db.Test.hasMany(db.Attempt, { foreignKey: 'testId' });
db.Attempt.belongsTo(db.Test, { foreignKey: 'testId' });

db.User.hasMany(db.Attempt, { foreignKey: 'userId' });
db.Attempt.belongsTo(db.User, { foreignKey: 'userId' });

db.Attempt.hasMany(db.AttemptAnswer, { foreignKey: 'attemptId', onDelete: 'cascade' });
db.AttemptAnswer.belongsTo(db.Attempt, { foreignKey: 'attemptId' });

db.Question.hasMany(db.AttemptAnswer, { foreignKey: 'questionId' });
db.AttemptAnswer.belongsTo(db.Question, { foreignKey: 'questionId' });

db.Option.hasMany(db.AttemptAnswer, { foreignKey: 'selectedOptionId' });
db.AttemptAnswer.belongsTo(db.Option, { foreignKey: 'selectedOptionId' });

module.exports = db;
