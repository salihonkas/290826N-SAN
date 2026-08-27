# QR Fotoğraf Sitesi V3

## Yerel kullanım
1. `npm install`
2. `npm start`
3. Yükleme: `http://localhost:3000/upload`
4. Yönetici: `http://localhost:3000/admin`

Varsayılan yönetici şifresi: `DEGISTIR`  
Canlıya almadan değiştirin.

## İnternete yayınlama
GitHub'a yükleyip Render üzerinde bir Node.js Web Service olarak yayınlayın.
Kalıcı fotoğraf saklamak için `/var/data/uploads` mount path'ine persistent disk ekleyin.
`ADMIN_PASSWORD`, `SITE_URL` ve `UPLOAD_DIR` ortam değişkenlerini ayarlayın.
