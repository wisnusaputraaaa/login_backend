const express = require('express')
const app =  express();
const port = 3000;
const bodyParser = require('body-parser');
const router = require('./routes/index');
const cookieParser = require('cookie-parser');

app.use(express.static('navbar-app'));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(router);

app.use('/', router);

app.listen(port, () => {
  console.log(`This app listening on port ${port}`);
});