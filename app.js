/* eslint-disable no-console */


const express = require('express');
const jwt = require('jsonwebtoken');
const jsonpatch = require('fast-json-patch');
const Fs = require('fs');
const Path = require('path');
const sharp = require('sharp');
const Axios = require('axios');


const app = express();


// welcome route======================================================================================================================================
app.get('/api', (req, res) => {
  res.json({
    message: 'welcome to api route',
  });
});


// protected route==================================================================================================================================
app.post('/api/posts', verifyToken, (req, res) => {
  jwt.verify(req.token, 'secretkey goes here', (err, authData) => {
    if (err) {
      res.sendStatus(403);
    } else {
      res.json({
        message: 'post created',
        authData,
      });
    }
  });
});


// login route=======================================================================================================================================
app.post('/api/login', (req, res) => {
  // mock user
  const user = {
    id: 1,
    username: 'brad',
    email: 'brad@gmail.com',
  };

  // jwt token expires in 60 secs
  jwt.sign({ user }, 'secretkey goes here', { expiresIn: '60s' }, (err, token) => {
    res.json({
      token,
    });
  });
});


// patch route=====================================================================================================================================
app.get('/api/patch', verifyToken, (req, res) => {
  let document = { firstName: 'Albert', contactDetails: { phoneNumbers: [] } };

  const patch = [
    { op: 'replace', path: '/firstName', value: 'Joachim' },
    { op: 'add', path: '/lastName', value: 'Wester' },
    { op: 'add', path: '/contactDetails/phoneNumbers/0', value: { number: '555-123' } },
  ];

  document = jsonpatch.applyPatch(document, patch).newDocument;

  res.send(document);
});


// download image and resize it to thumbnail=========================================================================================================
app.get('/api/thumbs', verifyToken, (req, res) => {
  const format = req.query.format;
  const path = Path.resolve('image.jpg');

  const response = Axios({
    method: 'get',
    url: 'http://bit.ly/2mTM3nY',
    responseType: 'stream',
  }).then((response) => {
    response.data.pipe(Fs.createWriteStream(path));
  }).then(() => {
    // Set the content-type of the response
    res.type(`image/${format || 'png'}`);

    // Get the resized image
    resize('image.jpg', format, 50, 50).pipe(res);
  });


  // resize function definition======================================================================================================================
  function resize(path, format, width, height) {
    const readStream = Fs.createReadStream(path);
    let transform = sharp();

    if (format) {
      transform = transform.toFormat(format);
    }


    if (width || height) {
      transform = transform.resize(width, height);
    }


    return readStream.pipe(transform);
  }
});


// verifyToken function===========================================================================================================================


// format of token
// authorization: bearer <accessToken>


function verifyToken(req, res, next) {
  // get auth header value
  const bearerHeader = req.headers.authorization;

  // check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // split at space
    const bearer = bearerHeader.split(' ');

    // get token from array
    const bearerToken = bearer[1];

    // set token to bearerToken
    req.token = bearerToken;

    // then call next middleware
    next();
  } else {
    // forbidden
    res.sendStatus(403);
  }
}


// run server on port================================================================================================================================
app.listen(4444, () => { console.log('server started on port 4444'); });
