const jwt = require('jsonwebtoken');
const connection = require('../config/database');

exports.refreshToken = (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(401);
        const compareRefreshTokenQuery = `SELECT * FROM users WHERE refresh_token = ?`
        connection.query(compareRefreshTokenQuery, [refreshToken], (error, results) => {
            if(error){
                throw error;
            }
            
            if (results.length === 0) {
                return res.sendStatus(401);
              }

            const user = results[0];
            const storedRefreshToken = user.refresh_token;
            if (storedRefreshToken === refreshToken) {
                jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                    if (error) return res.sendStatus(403);

                    const userId = results[0].id;
                    const name = results[0].name;
                    const email = results[0].email;
                    const accessToken = jwt.sign({userId, name, email}, process.env.ACCESS_TOKEN_SECRET, {
                        expiresIn: '15s'
                    })
                    res.json({ accessToken })
                })
            }
        })
    } catch (error) {
        console.log(error);
    }
}