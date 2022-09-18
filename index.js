const axios = require("axios");

const DATA_API = "";
const RESPONSE_API = "";


//get data from server and process it
axios.get(DATA_API)
    .then((res) => {
        const { data } = res;
        const { events } = data;

        const { result } = {};




        //post processed data to server
        axios.post(RESPONSE_API, result)
        .then((res) => {
            console.log(res.status == 200 ? "WE DID IT!" : "OOF, looks like we need to try again")
        })
    })



