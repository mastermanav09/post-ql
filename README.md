A web app in which users can post anything what they want and can also update their current status.

--Build Flow--

API built with Node + Express + GraphQL + MongoDB(mongoose).
WebApp built with React.

The app uses various react hooks and react-router-dom for routing.
To process the images in the server, multer package is used. This helps in extracting the path of the file and to store them in the desired path.
This web app also uses websockets API (socket.io) to be precise. Therefore, users can experience realtime interactions among them. However, it has been used in a very small scale in the app.

--Security--

This web app uses JWT(jsonwebtoken) for secure transmission of information between parties as a JSON object.
uuid package has been used to ensure that each type of information within the network is unique.
validatior package is used for user validation.
bcrypt package to encrypt the password that will be stored in the database.

--Testing--

For testing the flow, mocha and chai packages have been used.
