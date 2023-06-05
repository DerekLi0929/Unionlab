const greeting = document.querySelector('.greeting');

window.onload = () => {
    if (!sessionStorage.name) {
        location.href = '/login';
    } else {
        greeting.innerHTML = `hello ${sessionStorage.name}`;
    }
}

/*
const logOut = document.querySelector('.logout');

logOut.onclick = async () => {
    if (sessionStorage.email) {
        try {
            // Call the deletenovnc endpoint to stop and remove the container
            const response = await fetch(`/deletenovnc?email=${sessionStorage.email}`);
            const data = await response.json();
            if (data.code === 200) {
                console.log(data.message);
            } else {
                console.error('Error during container deletion:', data.message);
            }

            // Call the logout-user endpoint to release the user's port
            const logoutResponse = await fetch('/logout-user', {
                method: 'post',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ email: sessionStorage.email }),
            });

            const logoutData = await logoutResponse.json();
            if (logoutData.code === 200) {
                console.log(logoutData.message);
            } else {
                console.error('Error during logout:', logoutData.message);
            }
        } catch (error) {
            console.error('Error during container deletion or logout:', error);
        }
    }

    sessionStorage.clear();
    location.reload();
};*/

const logOut = document.querySelector('.logout');

logOut.onclick = async () => {
    if (sessionStorage.email) {
        try {
            // Call the logout-user endpoint to stop the container and release the user's port
            const logoutResponse = await fetch('/logout-user', {
                method: 'post',
                headers: new Headers({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ email: sessionStorage.email }),
            });

            const logoutData = await logoutResponse.json();
            if (logoutData.code === 200) {
                console.log(logoutData.message);
            } else {
                console.error('Error during logout:', logoutData.message);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    sessionStorage.clear();
    location.reload();
};



//logOut.onclick = () => {
//    sessionStorage.clear();
//    location.reload();
//}




const vncButton = document.querySelector('.vnc-button');

window.onload = async () => {
    if (!sessionStorage.name || !sessionStorage.email) {
        location.href = '/login';
    } else {
        greeting.innerHTML = `hello ${sessionStorage.name}`;

        try {
            const response = await fetch(`/get-user-port?email=${sessionStorage.email}`);
            const data = await response.json();

            if (data && data.assignedPort) {
                vncButton.onclick = () => {
                    location.href = `http://localhost:${data.assignedPort}/vnc.html`;
                };
            } else {
                alert("Error: Could not get assigned port for the user");
            }
        } catch (error) {
            console.error('Error fetching assigned port:', error);
            alert("Error: Could not get assigned port for the user");
        }
    }
};

// ... (rest of the code remains the same)

//vncButton.onclick = () => {
//    location.href = 'http://localhost:8001/vnc.html';
//}
