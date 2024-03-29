const express = require("express");
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken')
const app = express()
const port = 8080
app.use(express.json())

// headers for CORS
const corsHeaders = {
    'Access-Control-Allow-Headers': "Origin,X-Requested-With,Content-Type,Accept,Authorization",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
    "Access-Control-Max-Age": 2592000
}


function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' })// Generate JWT that logs out after 1 hr
}

function authenticateToken(req, res, next) {//middleware for authenticating token
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log("Error: " + err)

    if (err) return res.sendStatus(403)

    req.user = user

    next()
  })
}

// get config vars
dotenv.config()



app.use(function(req, res, next){// Middleware for handling CORS
    res.header(corsHeaders)
    next()
})

app.options('/*', (req, res) => {
    console.log("options request")
    res.send(200)
})

var users = {}

// default resource
app.get('/', (req, res) => {
    res.send('Welcome to Quattie!')
})

app.post('/signup', (req, res) => {
    /*
        Sign up for a new account
    */

    const { username, password, initial_deposit } = req.body

    if (users[username] == null){
        // addd new user
        users[username] = { password: password, balance: initial_deposit, pending_requests: [], history: [{username:username, amount: parseFloat(initial_deposit), trans_type: 'deposit'}]}
        console.log("New user added")
        res.send({ message: `New user added. Your username is ${username}, and your balance is ${initial_deposit}`})
    } else {
        console.log("User already exists")
        res.send({message: 'User already exists'})
    }
})

app.post('/login', (req, res) =>{
    console.log(`Login request from user: ${req.body.username}`)
    const { username, password } = req.body
    if (users[username] == null){
        res.send({message: "user does not exist"})
    } else {
        user = users[username]
        if(user.password !== password) {
            res.send({message: "incorrect password"})
        } else {
            const token = generateAccessToken({ username: req.body.username });
            res.json(token)    
            console.log(token)
        }
    }
})

app.post('/deposit', (req, res) => {    
    /*
        Deposit funds into your account
    */
})

app.post('/withdraw', (req, res) => {
    /* 
        Withdraw funds from you account
    */

})



app.get('/wallet', authenticateToken, (req, res) => {
    /*
        get current wallet balance
    */

    const { username } = req.user
    console.log(`wallet balance request from user: ${username}`)
    let current_user = users[username]
    if (users[username] == null){ 
        res.send({ message: 'sender does not exist' })
    } else {
        let pending_requests = current_user['pending_requests']
        let balance = current_user['balance']
        console.log(`Your current balance is: ${balance}`)
        res.json({username: username, balance: balance, pending: pending_requests})
    }

})

app.get('/history', authenticateToken, (req, res) => {
    /* 
        get user history
    */

    const { username } = req.user
    console.log(`History request for user ${username}`)
    let current_user = users[username]
    if (users[username] == null){ 
        res.send({ message: 'sender does not exist' })
    } else {
        let history = current_user['history']
        console.log(history)
        res.json({history: history})
    }
})


app.post('/transact', authenticateToken, (req, res) => {
    /*
        request or send money from a sender to a user
    */
    //transaction object
    const {taker_name, amount, trans_type } = req.body
    const maker_name = req.user.username
    const maker = users[maker_name] // makes request
    const taker = users[taker_name] //takes request

    if (taker == null) {
        console.log('user does not exist')
        res.send({ message: 'user does not exist'})
    }

    if (trans_type === 'send'){
    //check to see if transaction amount is <= sender balance
    console.log('send request')
        if (maker.balance < amount) {
            res.send({
                message: `${maker_name} does not have enough balance to conduct this transaction` 
                })
        } else {
            maker['balance'] -= amount
            taker['balance'] += amount
            
            //update transaction history
            maker['history'].push({taker_name, amount, trans_type })
            taker['history'].push({maker_name, amount, trans_type })

            res.send({
                message: `${amount} was sent to ${taker_name}`
            })
        }
    } else if (trans_type === 'request'){
        taker['pending_requests'].push({ sender, amount, trans_type })
        res.send({message: `we have requested a payment of ${amount} from ${take_name}`})
    } else {
        res.send({message: 'Transaction type not recognized'})
    }

})

app.listen(port, () => {
    console.log(`App listening on port: ${port}`)
})