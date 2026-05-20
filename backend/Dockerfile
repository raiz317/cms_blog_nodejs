FROM ://redhat.com
WORKDIR /app
# Diarahkan ke folder backend tempat package.json berada
COPY backend/package*.json ./
RUN npm install
# Diarahkan ke folder backend untuk menyalin sisa kode program
COPY backend/ .
EXPOSE 5000
CMD ["node", "index.js"]
