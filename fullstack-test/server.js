const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const { exec } = require('child_process');
const axios=import('axios')
//const { exec, spawn } = require('child_process');
const fs = require('fs');


const util = require('util');

const execPromise = util.promisify(exec);


function generateUniqueId(email) {
    const emailName = extractEmailName(email);
    return `${emailName}`;
}

function extractEmailName(email) {
    return email.substring(0, email.indexOf('@'));
}



const client = new Redis();

client.on('connect', () => {
    console.log('Connected to Redis...');
});

const app = express();

let initialPath = path.join(__dirname, "public");

app.use(bodyParser.json());
app.use(express.static(initialPath));

app.get('/', (req, res) => {
    console.log('this api triggered')
    res.sendFile(path.join(initialPath, "index.html"));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(initialPath, "login.html"));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(initialPath, "register.html"));
});

app.post('/register-user', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name.length || !email.length || !password.length) {
        res.json('fill all the fields');
    } else {
        const user = await client.hgetall(email);
        if (user && user.name) {
            res.json('email already exists');
        } else {
            await client.hmset(email, 'name', name, 'password', password);
            res.json({ name, email });
        }
    }
});

// ... (other code remains the same)

app.post('/login-user', async (req, res) => {
    const { email, password } = req.body;

    const user = await client.hgetall(email);
    if (!user || !user.name) {
        res.json('email or password is incorrect');
    } else if (user.password === password) {
        let assignedPort = parseInt(user.assignedPort);
        if (!assignedPort) {
            for (let port = 8001; port <= 8010; port++) {
                const portUser = await client.hget(`port:${port}`, 'email');
                if (!portUser) {
                    assignedPort = port;
                    await client.hmset(email, 'assignedPort', assignedPort);
                    await client.hmset(`port:${assignedPort}`, 'email', email);
                    break;
                }
            }
        }
        res.json({ name: user.name, email: email, assignedPort: assignedPort });
    } else {
        res.json('email or password is incorrect');
    }
});

// the port will increase 1 for the new user, but it can not refill the empty port seat from the beginning

// ... (other code remains the same)
async function startVNC(port, email) {
    const apiUrl = "http://localhost:3000/startvncnull";
    const urlWithParams = new URL(apiUrl);
    urlWithParams.searchParams.append("port", port);
    urlWithParams.searchParams.append("email", email);
  
    try {
      const response = await fetch(urlWithParams, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Error fetching the API:", error);
    }
  }


  async function stopVNC(port) {
    const apiUrl = "http://localhost:3000/endvncnull";
    const urlWithParams = new URL(apiUrl);
    urlWithParams.searchParams.append("port", port);
  
    try {
      const response = await fetch(urlWithParams, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Error fetching the API:", error);
    }
  }
  




  async function startNoVNCContainer(localport, frpport, email) {
    const uniqueContainerId = generateUniqueId(email);
  
    try {
      const data = await fs.promises.readFile('dockerscript.sh', 'utf8');
      let replacedData = data.replace(/CONTAINER_ID_PLACEHOLDER/g, uniqueContainerId);
      replacedData = replacedData.replace(/LOCAL_PORT_PLACEHOLDER/g, localport);
      replacedData = replacedData.replace(/FRP_PORT_PLACEHOLDER/g, frpport);
  
      await fs.promises.writeFile('dockerscript_cp.sh', replacedData, 'utf8');
      await execPromise('chmod +x dockerscript_cp.sh'); // Ensure the script is executable
  
      // Use "sudo -S" to read the password from stdin
      const password = process.env.SUDO_PASSWORD;
      const cmd = `echo '${password}' | sudo -S ./dockerscript_cp.sh`;
  
      const { stdout, stderr } = await execPromise(cmd);
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      return { code: 200, message: "started novnc container", containerId: uniqueContainerId };
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
  

  
  

/* function startNoVNCContainer(localport, frpport, email) {
    const uniqueContainerId = generateUniqueId(email);
  
    fs.readFile('dockerscript.sh', 'utf8', (err, data) => {
        if (err) {
            console.error(`readFile error: ${err}`);
            return;
        }
  
        let replacedData = data.replace(/CONTAINER_ID_PLACEHOLDER/g, uniqueContainerId);
        replacedData = replacedData.replace(/LOCAL_PORT_PLACEHOLDER/g, localport);
        replacedData = replacedData.replace(/FRP_PORT_PLACEHOLDER/g, frpport);
  
        fs.writeFileSync('dockerscript_cp.sh', replacedData, 'utf8');
  
        exec('./dockerscript_cp.sh', (error, stdout, stderr) => {
        
  
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            return { code: 200, "message": "started novnc container", containerId: uniqueContainerId };
        });
    });
  }  */
  




app.get('/get-user-port', async (req, res) => {
    const email = req.query.email;

    if (!email) {
        res.status(400).json({ code: 400, message: "Email is required" });
        return;
    }

    const user = await client.hgetall(email);
    if (!user || !user.name || !user.assignedPort) {
        res.status(404).json({ code: 404, message: "User not found or no port assigned" });
        return;
    } 
    const assignedPort = parseInt(user.assignedPort);
    startVNC(assignedPort-8000, email);
    
    startNoVNCContainer(assignedPort, assignedPort-1920, email);

    res.json({ assignedPort: user.assignedPort });
});

/*
app.get("/logout", async (req, res) => {
    const email = req.query.email; // Get email from the query parameter

    if (!email) {
        res.status(400).json({ code: 400, message: "Email is required" });
        return;
    }

    const user = await client.hgetall(email);
    if (!user || !user.name) {
        res.status(404).json({ code: 404, message: "User not found" });
        return;
    }

    await client.del(email);
    res.json({ code: 200, message: "User data deleted successfully" });
});
*/

/* app.post('/logout-user', async (req, res) => {
    const { email } = req.body;

    const user = await client.hgetall(email);
    if (!user || !user.name || !user.assignedPort) {
        res.status(400).json({ code: 400, "message": "Email is not registered or no port assigned" });
        return;
    }

    const uniqueContainerId = generateUniqueId(email);
    // Stop and remove the Docker container
    exec(`sudo docker stop ${uniqueContainerId}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).json({ code: 500, "message": "Internal server error" });
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);

        // Remove the assigned port from Redis
        client.hdel(email, 'assignedPort', async (err) => {
            if (err) {
                console.error('Error deleting assigned port:', err);
                res.status(500).json({ code: 500, "message": "Internal server error" });
            } else {
                // Delete the port assignment in the "port:<port_number>" hash
                const assignedPort = parseInt(user.assignedPort);
                await client.hdel(`port:${assignedPort}`, 'email');

                res.json({ code: 200, "message": "Logged out and container stopped" });
            }
        });
    });
}); */


/* app.post('/logout-user', async (req, res) => {
    const { email } = req.body;

    const user = await client.hgetall(email);
    if (!user || !user.name || !user.assignedPort) {
        res.status(400).json({ code: 400, "message": "Email is not registered or no port assigned" });
        return;
    }

    const uniqueContainerId = generateUniqueId(email);
    // Stop and remove the Docker container
    exec(`sudo docker stop ${uniqueContainerId}`,async (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).json({ code: 500, "message": "Internal server error" });
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);

        // Kill the VNC server
        const assignedPort = parseInt(user.assignedPort);
        
        const targetApiUrl = `http://34.202.158.241:3000/endvncnull?port=${assignedPort - 8000}`;
        try {
            const response = await axios.get(targetApiUrl);
            res.json(response.data);
            // Remove the assigned port from Redis
            client.hdel(email, 'assignedPort', async (err) => {
                if (err) {
                    console.error('Error deleting assigned port:', err);
                    res.status(500).json({ code: 500, "message": "Internal server error" });
                } else {
                    // Delete the port assignment in the "port:<port_number>" hash
                    await client.hdel(`port:${assignedPort}`, 'email');

                    res.json({ code: 200, "message": "Logged out, VNC server killed, and container stopped" });
                }
            });
          } catch (error) {
            console.error(`Error calling the target API: ${error.message}`);
            res.status(500).json({ code: 500, message: 'Error calling the target API' });
          }
    });
}); */

app.post('/logout-user', async (req, res) => {
    const { email } = req.body;
  
    const user = await client.hgetall(email);
    if (!user || !user.name || !user.assignedPort) {
      res.status(400).json({ code: 400, "message": "Email is not registered or no port assigned" });
      return;
    }
  
    const uniqueContainerId = generateUniqueId(email);
    // Stop and remove the Docker container
    exec(`sudo docker stop ${uniqueContainerId}`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        res.status(500).json({ code: 500, "message": "Internal server error" });
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
  
      // Kill the VNC server
      const assignedPort = parseInt(user.assignedPort);
      try {
        // Call the stopVNC function to stop the VNC server
        await stopVNC(assignedPort-8000);
  
        // Remove the assigned port from Redis
        client.hdel(email, 'assignedPort', async (err) => {
          if (err) {
            console.error('Error deleting assigned port:', err);
            res.status(500).json({ code: 500, "message": "Internal server error" });
          } else {
            // Delete the port assignment in the "port:<port_number>" hash
            await client.hdel(`port:${assignedPort}`, 'email');
  
            res.json({ code: 200, "message": "Logged out, VNC server killed, and container stopped" });
          }
        });
      } catch (error) {
        console.error(`Error calling the endvncnull API: ${error.message}`);
        res.status(500).json({ code: 500, message: 'Error calling the endvncnull API' });
      }
    });
  });
  



app.listen(4000, (req, res) => {
    console.log('listening on port 4000......');
});
