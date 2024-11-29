// WU Qianjie 22102977D & WANG Kaiyuan 22101552D
import express from 'express';
import login from './login.js';
import path from 'path';
import accountPage from './account-page.js';
import session from 'express-session';
import mongostore from 'connect-mongo';
import client from './dbclient.js';
import events from './events.js';
import venues from './venues.js';
import user from './user.js';
import order from './order.js';

const app = express();

app.use(   
  session({
    secret: 'eie4432_group_project',     
    resave: false,     
    saveUninitialized: false, 
    store: mongostore.create({       
      client,       
      dbName: 'eie4432_project_db',
      collectionName: 'session',     
    }),
  }) 
);

// For login related APIs
app.use('/auth', login);

// For account page related APIs
app.use('/account', accountPage);

// For event related APIs
app.use('/events', events);

// For venue related APIs
app.use('/venues', venues);

// For user related APIs
app.use('/user', user);

// For order related APIs
app.use('/order', order);


app.get('/', (req, res, next) => {
  res.redirect('/index.html');
});

app.listen(8080, () => {
  console.log(Date() + '\nServer started at http://127.0.0.1:8080');
});

app.use('/', express.static(path.join(process.cwd(), '/static')));
