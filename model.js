const Sequelize = require('sequelize');
const options = { logging: false};
const sequelize = new Sequelize ("sqlite:quizzes.sqlite", options);

/*const user = sequelize.define(
  'user',
  { name: {
    type: Sequelize.STRING,
    unique: {msg: "Name already exists"},
    validate:{
      is: {args: /^[a-z]+$/i, msg: "name: ivalid characters"}
      }
    }
  }
);*/

sequelize.define('quiz', {
  question: {
    type: Sequelize.STRING,
    unique: {msg: "Ya existe esta pregunta"},
    validate: {notEmpty: {msg: "La pregunta no puede estar vacía"}}
  },
  answer: {
     type: Sequelize.STRING,
     validate: {notEmpty: {msg: "La respuesta no puede estar vacía"}}
  }
});

sequelize.sync()
.then(() => sequelize.models.quiz.count())
.then(count => {
  if (!count) {
    return sequelize.models.quiz.bulkCreate([
      {question: "Capital de Italia", answer:"Roma"},
      {question: "Capital de Francia", answer:"Paris"},
      {question: "Capital de España", answer:"Madrid"},
      {question: "Capital de Portugal", answer:"Lisboa"}
    ]);
  }
})
.catch(error => {
  console.log(error);
});


// Relación 1 a N entre users y quizzes
/*quiz.belongsTo(user, {as: 'author', foreignKey: 'authorId'});
user.hasMany(quiz, {as:'posts', foreignKey: 'authorId'});*/

module.exports = sequelize;