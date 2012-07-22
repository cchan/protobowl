// Generated by CoffeeScript 1.3.3
var countDuration, countStart, cumsum, currentGuess, currentQuestion, generateName, identifier, isCompleted, lastTime, publicname, revealDelay, serverTime, socket, stateUpdater, sync_offset, synchronize, tableOwner, timeFreeze;

socket = io.connect().of(channel_name);

sync_offset = 0;

currentQuestion = null;

lastTime = null;

revealDelay = null;

tableOwner = null;

isCompleted = false;

timeFreeze = false;

identifier = Math.random().toString(36).slice(3);

currentGuess = "";

generateName = function() {
  var adjective, animal, pick;
  adjective = 'aberrant,agressive,warty,hoary,breezy,dapper,edgy,feisty,gutsy,hardy,intrepid,jaunty,karmic,lucid,maverick,natty,oneric,precise,quantal';
  animal = 'axolotl,warthog,hedgehog,badger,drake,fawn,gibbon,heron,ibex,jackalope,koala,lynx,meerkat,narwhal,ocelot,penguin,quetzal,kodiak,cheetah,puma,jaguar,panther,tiger,leopard,lion';
  pick = function(list) {
    var n;
    n = list.split(',');
    return n[Math.floor(n.length * Math.random())];
  };
  return pick(adjective) + " " + pick(animal);
};

publicname = generateName();

serverTime = function() {
  if (timeFreeze) {
    return timeFreeze;
  } else {
    return +(new Date) - sync_offset;
  }
};

cumsum = function(list, rate) {
  var num, sum, _i, _len, _results;
  sum = 0;
  _results = [];
  for (_i = 0, _len = list.length; _i < _len; _i++) {
    num = list[_i];
    _results.push(sum += Math.round(num) * rate);
  }
  return _results;
};

countDuration = 0;

countStart = 0;

stateUpdater = function() {
  var countdown, cumulative, endTimes, index, list, ms, rate, reveal, timeDelta, words, _ref;
  if (currentQuestion) {
    timeDelta = serverTime() - lastTime;
    words = currentQuestion.question.split(" ");
    _ref = currentQuestion.timing, list = _ref.list, rate = _ref.rate;
    cumulative = cumsum(list, rate);
    index = 0;
    while (timeDelta > cumulative[index]) {
      index++;
    }
    index++;
    if (isCompleted) {
      index = cumulative.length;
      reveal = 0;
    } else {
      endTimes = cumulative[cumulative.length - 1];
      reveal = endTimes + revealDelay + lastTime - serverTime();
    }
    document.querySelector('#answer').innerText = currentQuestion.answer;
    if (reveal <= 0) {
      document.querySelector('#answer').style.visibility = '';
    } else {
      document.querySelector('#answer').style.visibility = 'hidden';
    }
    reveal = Math.max(0, reveal);
    document.querySelector('#reveal').innerText = (reveal / 1000).toFixed(1);
    document.querySelector("#visible").innerText = words.slice(0, index).join(' ') + " ";
    document.querySelector("#unread").innerText = words.slice(index).join(' ');
  }
  ms = Math.max(0, countDuration - (new Date - countStart));
  countdown = (ms / 1000).toFixed(1);
  if (countDuration > 0) {
    document.querySelector('#countdown').style.display = '';
    if (tableOwner === publicname) {
      return document.querySelector('#countdown').innerText = countdown;
    } else {
      return document.querySelector('#countdown').innerText = countdown + ' ' + tableOwner + ": " + currentGuess;
    }
  } else {
    document.querySelector('#guess').style.display = "none";
    return document.querySelector('#countdown').style.display = 'none';
  }
};

setInterval(stateUpdater, 50);

synchronize = function(data) {
  console.log("sync", data);
  if (data.question) {
    currentQuestion = data.question;
  }
  sync_offset = +(new Date) - data.time;
  countDuration = data.countDuration;
  countStart = +(new Date);
  lastTime = data.lastTime;
  revealDelay = data.revealDelay;
  timeFreeze = data.timeFreeze;
  tableOwner = data.tableOwner;
  currentGuess = data.guess;
  isCompleted = data.completed;
  return stateUpdater();
};

socket.on('sync', synchronize);

socket.on('disconnect', function() {
  document.querySelector('#disco').style.display = '';
  return document.querySelector('#main').style.display = 'none';
});

document.addEventListener('keydown', function(e) {
  if (tableOwner === publicname) {

  } else if (e.keyCode === 13) {
    socket.emit('buzz', {
      name: publicname,
      id: identifier
    }, function(status) {
      if (status === "who's awesome? you are!") {
        document.querySelector('#guess').style.display = "";
        document.querySelector('#guess').value = "";
        document.querySelector('#guess').focus();
      }
      return console.log("current state", status);
    });
    return console.log("pressed enter");
  } else if (e.keyCode === 90) {
    return socket.emit('unpause', "because the universe makes no sense", function(status) {
      return console.log("pause permissions", status);
    });
  } else if (e.keyCode === 80) {
    return socket.emit('pause', "because the universe makes no sense", function(status) {
      return console.log("unpause permissions", status);
    });
  } else if (e.keyCode === 83) {
    return socket.emit('skip', "because the universe makes no sense", function(status) {
      return console.log("skip permissions", status);
    });
  }
});

document.addEventListener('keyup', function(e) {
  var typing;
  if (document.activeElement.id === "guess" && tableOwner === publicname) {
    typing = document.querySelector('#guess').value;
    if (e.keyCode === 13 && typing) {
      socket.emit('guess', {
        guess: typing,
        final: true
      }, function(status) {
        return console.log("guess final", status);
      });
      return document.body.focus();
    } else {
      return socket.emit('guess', {
        guess: typing,
        final: false
      }, function(status) {
        return console.log("guess", status);
      });
    }
  }
});
