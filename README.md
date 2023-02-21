# Super simple UDP nameserver for Node.js

## How to install on server

I'm using Ubuntu 22.04 LTS. First install Docker. After that:
    
```
docker login -u <username> -p <password> your.registry.com
docker pull your.registry.com/nodejs-dns-server:latest
```

Now when latest image is pulled, you can disable the default DNS 
server:
    
```
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved
```

Ok, 53 port is free now. Let's run the container:
    
```
docker run -d -p 53:53/tcp -p 53:53/udp --privileged --name nodejs-dns-server --restart=unless-stopped your.registry.com/nodejs-dns-server:latest
```

And that's it. Now you can use your server as a DNS server. 

If you want to update the image, you need to stop and remove the container, return the default DNS server 
and pull the new image:
    
```
docker stop nodejs-dns-server
docker rm nodejs-dns-server
sudo systemctl start systemd-resolved
docker pull your.registry.com/nodejs-dns-server:latest
```

After that stop the default DNS server again and run the container again.

## How to develop

Clone the repo. Create .env file with needed data. Run the following commands:

```
npm install
npm run start:dev
```

## Why I need this?

On our project we are serving a lot of clients with different domains. 
Cluster IP is the same for all of them, for some time. After it changes we need to update all "A" records. Not cool!

Easy way is to use custom nameservers, like:

```
ns1.yourdomain.com
ns2.yourdomain.com
```

You need to change DNS of a domain just once. After Cluster IP changes, you need to update only records in your 
DNS server, not in all domains records.

Plus custom server can be used for serving another records, like "MX" or "TXT".
