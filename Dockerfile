FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY food.js /usr/src/app/
COPY migrations /usr/src/app/migrations
RUN npm install sinon

EXPOSE 8080
CMD [ "npm", "start" ]
