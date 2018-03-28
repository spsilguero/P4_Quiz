const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require('./out');
const {models} = require('./model');

/**
*
*/
exports.helpCmd = (socket,rl) => {
  log(socket,'Comandos:');
  log(socket,'h|help - Muestra esta ayuda.');
  log(socket,'list - Listar los quizzes existentes.');
  log(socket,'show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
  log(socket,'add - Añadir un nuevo quiz interactivamente.');
  log(socket,'delete <id> - Borrar el quiz indicado.');
  log(socket,'edit <id> - Editar el quiz indicado.');
  log(socket,'test <id> - Probar el quiz indicado.');
  log(socket,'p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
  log(socket,'credits - Créditos.');
  log(socket,'q|quit - Salir del programa.');
  rl.prompt();
};

/**
*
*/
exports.listCmd = (socket,rl) => {
  
  models.quiz.findAll()
  .each(quiz => {
      log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} `);
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });

};

/**
* Funcion que devuelve una promesa que:
*   -Valida que se ha introducido un valor para el parametro
*   -Convierte el parametro a numero entero
*/
const validateId = id => {

  return new Sequelize.Promise ((resolve,reject) => {
    if (typeof id === "undefined") {
      reject(new Error(`Falta el parametro <id>.`));
    } else {
      id = parseInt(id);
      if (Number.isNaN(id)) {
        reject(new Error(`El valor del parametro <id> no es un numero.`));
      } else {
        resolve(id);
      }
    }
  });
};



/**
*
*/
exports.showCmd = (socket,rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}`);
    }
    log(socket,` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(error => {
    errorlog(socket,error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/**
*
*/
const makeQuestion = (rl,text) => {
 
  return new Sequelize.Promise((resolve,reject) =>{
    rl.question(colorize(text, 'red'), answer => {
      resolve(answer.trim());
    });
  });

};

/**
*
*/
exports.addCmd = (socket,rl) => {
  makeQuestion(rl, ' Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion(rl, ' Introduzca la respuesta: ')
    .then(a => {
      return {question:q, answer:a};
    });
  })
  .then(quiz => {
    return models.quiz.create(quiz);
  })
   .then(quiz => {
    log(socket,` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket,'El quiz es erroneo');
    error.errors.forEach(({message}) => errorlog(socket,message));
  })
  .catch(error => {
    errorlog(socket,error.message);
  })
  .then(() => {
    rl.prompt();
  });

};

/**
*
*/
exports.deleteCmd = (socket,rl, id) => {

  validateId(id)
  .then(id => models.quiz.destroy({where: {id}}))
  .catch(error => {
    errorlog(socket,error.message);
  })
  .then(() => {
    rl.prompt();
  });

};

/**
*
*/
exports.editCmd = (socket,rl, id) => {
 
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    return makeQuestion(rl, ' Introduzca la pregunta: ')
    .then(q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
      return makeQuestion(rl, ' Introduzca la respuesta: ')
      .then(a => {
        quiz.question= q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(socket,` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket,'El quiz es erroneo');
    error.errors.forEach(({message}) => errorlog(socket,message));
  })
  .catch(error => {
    errorlog(socket,error.message);
  })
  .then(() => {
    rl.prompt();
  });

};

/**
*
*/
exports.testCmd = (socket,rl, id) => {

  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}`);
    }
    return makeQuestion(rl, colorize(` ${quiz.question} `, 'red'))
    .then(a => {
      a = a.toLowerCase().trim();
      if (a === quiz.answer.toLowerCase()) {
        log(socket,` Respuesta ${colorize('correcta', 'green')}`);
      }else{
        log(socket,` Respuesta ${colorize('incorrecta', 'red')}`);
      }
    });
  })
  .catch(error => {
    errorlog(socket,error.message);
  })
  .then(() => {
    rl.prompt();
  });


};

/**
*
*/
exports.playCmd = (socket,rl) => {

  let score = 0;
  let toBeResolved = [];

   const playOne = () => {

    if (toBeResolved.length === 0) {
      log(socket,` No hay nada que responder. Fin. Puntuacion: ${score}`);
      //log(" No hay nada que responder");
      //log(` Puntuacion: ${score} `);
      rl.prompt();
    } else{

      let id = toBeResolved[Math.floor(Math.random() * toBeResolved.length)]; //cogemos una id al azar del array
      let index = toBeResolved.indexOf(id);
      toBeResolved.splice(index, 1); //quitamos la id del array

      models.quiz.findById(id)
      .then(quiz => {
        return makeQuestion(rl, colorize(` ${quiz.question} `, 'red'))
        .then(a => {
          a = a.toLowerCase().trim();
          if (a === quiz.answer.toLowerCase()) {
            score++;
            log(socket,` Respuesta correcta. Puntuacion: ${score}`);
            //log(` Respuesta ${colorize('correcta', 'green')}`);
            //log(` Puntuacion: ${score} `);
            playOne();
          }else{
            log(socket,` Respuesta incorrecta. Fin del juego. Puntuacion: ${score}`);
            //log(` Respuesta ${colorize('incorrecta', 'red')}`);
            //log(` Fin del juego `);
            //log(` Puntuacion: ${score} `);
            rl.prompt();
          }
        });

      })
    }

};


  models.quiz.findAll()
  .each(quiz => {
    toBeResolved.push(quiz.id);
  })
  .then(() =>{ 
    playOne();
  });
 
};

/**
*
*/
exports.creditsCmd = (socket,rl) => {
  log(socket,'Autor:');
  log(socket,'Saul perez-Silguero');
  rl.prompt();
};

/**
*
*/
exports.quitCmd = (socket,rl) => {
  rl.close();
  socket.end();
};