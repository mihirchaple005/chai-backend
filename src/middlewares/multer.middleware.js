import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "C:/Users/admin/Desktop/Backend/chaiAurBackend/public/temp")
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname) // original name place prr rakhna nahi chaiye bad practice hai
    }
  })
  
  export const upload = multer({ 
    storage,
})



// important 
// the first parameter of  cb(null, '/tmp/my-uploads') is null because we are not doing any error handing and even we don't need that  i.e. first parameter is for error handling 