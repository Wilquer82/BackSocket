# # syntax = docker/dockerfile:1

# # Adjust NODE_VERSION as desired
# ARG NODE_VERSION=18.17.1
# FROM node:${NODE_VERSION}-slim as base

# LABEL fly_launch_runtime="NodeJS"

# # NodeJS app lives here
# WORKDIR /app

# # Set production environment
# ENV NODE_ENV=production


# # Throw-away build stage to reduce size of final image
# FROM base as build

# # Install packages needed to build node modules
# RUN apt-get update -qq && \
#     apt-get install -y python-is-python3 pkg-config build-essential 

# # Install node modules
# COPY --link package.json package-lock.json .
# RUN npm install

# # Copy application code
# COPY --link . .



# # Final stage for app image
# FROM base

# # Copy built application
# COPY --from=build /app /app

# # Start the server by default, this can be overwritten at runtime
# CMD [ "npm", "run", "start" ]

# Especificando a imagem de base com a versão desejada do Node.js
FROM node:16.20.2

# Criando o diretório para a aplicação
WORKDIR /usr/src/app

# Copiando arquivos de dependência
COPY package*.json ./

# Instalando as dependências do aplicativo incluindo 'npm' no caso de haver scripts personalizados e hooks do Git.
RUN npm install

# Copiando os arquivos do aplicativo Node.js para o container
COPY . .

# A porta que o aplicativo irá rodar dentro do container
EXPOSE 8080

# O comando para iniciar o aplicativo, por exemplo:
CMD ["npm", "start"]