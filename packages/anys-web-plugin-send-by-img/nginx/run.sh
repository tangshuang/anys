# docker-machine restart
docker run -d --rm --name beco-nginx -p 8088:80 -v $(pwd):/etc/nginx -v $(pwd)/log:/var/log/nginx nginx
