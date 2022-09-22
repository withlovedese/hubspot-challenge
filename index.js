const axios = require("axios");
const sessionLimit = 600000;

const DATA_API =
  "https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=162ad1e1523222789c0cd32d4f38";
const RESPONSE_API =
  "https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=162ad1e1523222789c0cd32d4f38";

function visitorMap(events) {
  //make a object with all users and their data
  let visitorMap = {};
  events.forEach((event) => {
    let url = event["url"];
    let visitorId = event["visitorId"];
    let timestamp = event["timestamp"];
    if (!(visitorId in visitorMap)) {
      visitorMap[visitorId] = [];
    }
    visitorMap[visitorId].push({
      url,
      timestamp,
    });
  });
  //sort users in visitorMap by timestamp
  for (let visitor in visitorMap) {
    visitorMap[visitor].sort((x, y) => x.timestamp - y.timestamp);
  }
  return visitorMap;
}

function createUserSessions(visitorMap) {
  let userSessions = {};

  for (let visitor in visitorMap) {
    userSessions[visitor] = [];
    let events = visitorMap[visitor];
    //events.sort();
    let startTime = events[0].timestamp;
    let url = events[0].url;
    let endTime = startTime;
    let pages = [url];

    function addSession(startTime, endTime, pages) {
      userSessions[visitor].push({
        duration: endTime - startTime,
        pages: pages,
        startTime: startTime,
      });
    }

    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp <= endTime + sessionLimit) {
        pages.push(events[i].url);
        endTime = events[i].timestamp;
        //pages.sort();
      } else {
        addSession(startTime, endTime, pages);
        pages = [events[i].url];
        startTime = endTime = events[i].timestamp;
      }
    }

    if (pages.length > 0) {
      addSession(startTime, endTime, pages);
    }
    // let i = 1;

    // while (i < events.length) {
    //   let startTime = events[i - 1].timestamp;
    //   let pages = [events[i - 1].url];
    //   let duration = 0;

    //   //checks if a session is actually a session lol
    //   while (
    //     i < events.length &&
    //     events[i].timestamp - events[i - 1].timestamp <= sessionLimit
    //   ) {
    //     pages.push(events[i].url);
    //     i++;
    //   }

    //   if (i - 1 > 0) {
    //     duration = events[i - 1].timestamp - startTime;
    //   }

    //   let session = {
    //     duration: duration,
    //     pages: pages,
    //     startTime: startTime,
    //   };

    //   userSessions[visitor].push(session);
    //   i++;
    // }

    // //deal with edge case? (last page i think)
    // // if (
    // //   events[events.length - 1].timestamp - events[0].timestamp >
    // //   sessionLimit
    // // ) {
    // //   userSessions[visitor].push({
    // //     duration: 0,
    // //     pages: [events[events.length - 1].url],
    // //     startTime: events[events.length - 1].timestamp,
    // //   });
    // // }

    // let lastSession = {
    //   duration: 0,
    //   pages: [events[events.length - 1].url],
    //   startTime: events[events.length - 1].timestamp,
    // };
    // userSessions[visitor].push(lastSession);

    userSessions[visitor].sort((x, y) => x.startTime - y.startTime);
  }

  return userSessions;
}

//get data from server and process it
axios
  .get(DATA_API)
  .then((res) => {
    const { data } = res;
    const { events } = data;

    //console.log(events);
    const visitors = visitorMap(events);
    //console.log(visitors);
    const sessionsByUser = createUserSessions(visitors);
    //console.log(userSessions);
    //console.log(JSON.stringify({ sessionsByUser }));
    //post processed data to server
    axios
      .post(RESPONSE_API, { sessionsByUser })
      .then((res) => {
        console.log(
          res.status == 200
            ? "WE DID IT!"
            : "OOF, looks like we need to try again"
        );
      })
      .catch((error) => {
        console.log(error);
      });
  })
  .catch((error) => {
    console.log(error);
  });
