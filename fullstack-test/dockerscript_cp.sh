                                                                               
#!/bin/bash
# Set the name of the Docker image and the name of the container
IMAGE_NAME="novnc"
#haolunli="abcdef"
CONTAINER_NAME="haolunli"
LOCALPORT="8001"
FRPPORT="6081"
# Stop and remove any existing containers with the same name
sudo docker stop $CONTAINER_NAME
sudo docker rm $CONTAINER_NAME
# Run the Docker image and map port 8000 on the local machine to port 8000 on the container
sudo docker run -itd --name $CONTAINER_NAME -p $LOCALPORT:8000 $IMAGE_NAME
# Run a simple command in the terminal of the container
sudo docker exec -itd $CONTAINER_NAME sh -c "/usr/share/novnc/utils/launch.sh --listen 8000 --vnc 34.202.158.241:$FRPPORT"

