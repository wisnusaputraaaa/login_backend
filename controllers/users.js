const { query } = require('express');
const connection = require('../config/database.js');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const saltRounds = 10;

exports.getUsersHandler = async (req,res) => {
  try {
    //Query untuk menampilkan seluruh data dari table users yang ada di DB
    const query = `SELECT * FROM users`

    //Eksekusi query untuk menampilkan seluruh data yang ada didalam DB
    connection.query(query, (error, result) => {
      if (error) {
        res.status(500).json({success: false, msg: 'Gagal saat mengambil data!'})
      }else{
        const users = result.map((users) => {
          return {
            userId: users.id,
            userName: users.name,
            userEmail: users.email
          }
        })
        res.status(200).json({success: true, data: users})
      }
    })
  } catch (error) {
    res.status(500).json({success: false, msg: 'Terjadi kesalahan saat mengambil data!'})
  }
}

exports.userRegistrasiHandler = async (req, res) => {
  try {
    const { name, email, password, confPassword } = req.body;

    //Cek password harus sama dengan konfirmasi password
    if (password !== confPassword) {
      return res.status(400).json({success: false, msg: 'Password dan Konfirmasi Password tidak cocok'});
    }

    //Cek pastikan field name, email dan password harus terisi
    if (!name || !email || !password) {
      return res.status(400).json({success: false, msg: 'Nama, Email dan Password harus diisi'});
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, msg: 'Email tidak ngontol' });
    }
    
   
    //Menyiapkan query untuk menyisipkan data kedalam DB
    const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

    //Menggunakan bcrypt untuk mengenkripsi password 
    const salt = await bcrypt.genSalt(saltRounds);
    const hashPassword = await bcrypt.hash(password, salt);
    
    //Eksekusi query untuk dimasukan kedalam DB
    connection.query(query, [name, email, hashPassword], (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({success: false, msg: 'Gagal melakukan ewe'});
      }else{
          //Berhasil melakukan registrasi
        return res.status(200).json({success: true, msg: 'ewe berhasil'});
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({success: false, msg: 'Terjadi kesalahan server'});
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginQuery = 'SELECT * FROM users WHERE email = ?';

    connection.query(loginQuery, [email], async (error, results) => {
      if (error) {
        throw error;
      }
      if (results.length === 0) {
        return res.status(401).json({success: false, msg: 'Email tidak ditemukan!'})
      }
      if (results.length > 0) {
        bcrypt.compare(password, results[0].password, (error, match) => {
          if(error) {
            return console.log(error)
          }
          if(match){
            const userId = results[0].id;
            const name = results[0].name;
            const email = results[0].email;
            const accessToken = jwt.sign({userId, name, email}, process.env.ACCESS_TOKEN_SECRET, {
              expiresIn: '20s'
            });
            const refreshToken = jwt.sign({userId, name, email}, process.env.REFRESH_TOKEN_SECRET, {
              expiresIn: '1d'
            })
            const saveRefreshTokenQuery = `UPDATE users SET refresh_token = ? WHERE id = ?`
            connection.query(saveRefreshTokenQuery,[refreshToken, userId], (error, results) => {
              if(error){
                console.log(error);
              }else{
                console.log('Berhasil menambahkan refresh token ke database')

                res.cookie('refreshToken', refreshToken, {
                  httpOnly: true,
                  maxAge: 24 * 60 * 60 * 1000
                })
               res.json({ accessToken })
              }
            })
            
          }else{
            return res.status(401).json({success: false, msg: 'Password salah!'})
          }
        })
      }
    });
  } catch (error) {
    // Tangani kesalahan
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

exports.logOut = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    const compareRefreshTokenQuery = `SELECT * FROM users WHERE refresh_token = ?`;
    connection.query(compareRefreshTokenQuery, [refreshToken], (error, results) => {
      if (error) {
        throw error;
      }
      
      if (results.length === 0) {
        return res.sendStatus(204);
      }

      const userId = results[0].id;
      const updateRefreshTokenQuery = `UPDATE users SET refresh_token = NULL WHERE id = ?`;
      connection.query(updateRefreshTokenQuery, [userId], (error, decode) => {
        if (error) {
          throw error;
        }else{
          console.log(`Berhasil memperbarui refresh token dari database`);
          res.clearCookie('refreshToken'); 
          res.sendStatus(200);
        }
      })
    })
  } catch (error) {
    res.status(500).json({success: false, msg: 'Terjadi kesalahan server'})
  }
}