# Secrets Sharing Website

 - Website is created using NodeJs, ExpressJS and MongoDB database.
 - In this website the users can share there secrets anonymously.
 - Also they can view the secrets of other users.
 
 For privacy of users, implemented the high level secure authorization.
 
## Levels of Authorization:

 ### Level 1:
    - Register Users with username and plain password.
 ### Level 2:
    - Database encryption using environment variables(Secret Key).
 ### Level 3:
    - Hashing the passwords.
 ### Level 4:
    - Salting and Hashing passwords using bcrypt.
 ### Level 5:
    - Sessions and Cookies with passport.js which includes all the previous levels of authentication.
 ### Level 6:
    - Oauth 2.0, Sign In with Google.
