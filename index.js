const express= require("express");
const cors= require("cors");
const app=express();
const models = require('./models');
const multer= require("multer");
const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const secretKey='dkfjoewkfnldksa1123245';

//const upload=multer({dest: 'uploads/'});
const upload = multer({
  storage: multer.diskStorage({
     destination: function (req, file, cb) {
        cb(null, "uploads");
     },
     filename: function (req, file, cb) {
        cb(null, file.originalname);
     },
  }),
});
const port=8080;

app.use(express.json());//json형식의 데이터 처리할수 있도록 설정하는 코드
app.use(cors({
  origin: ['http://localhost:3000', 'https://tr-taupe.vercel.app'], //허용하는 출처 목록
  credentials: true
}
)) //브라우저 이슈 막기위한것
app.use("/uploads", express.static("uploads"));



app.get('/products', (req, res)=>{
  models.Product.findAll()
  .then((result)=>{
    console.log("PRODUCTS :", result);
    res.send({
      products: result
    })
  })
  .catch((error)=>{
    console.error(error)
    res.send("에러발생")
  })
})


app.post('/products', (req, res) => {
  const body = req.body;
  console.log('Received product data:', body); // 요청 본문 출력

  const { name, description, imageUrl } = body;

  // 필수 필드만 확인하도록 수정
  if (!name || !description) {
    return res.status(400).send("제목과 설명은 필수 입력사항입니다");
  }

  models.Product.create({
    name,
    description,
    imageUrl: imageUrl || '', // 기본값 설정
  }).then((result) => {
    console.log('상품생성결과:', result);
    res.send({ product: result });
  }).catch((error) => {
    console.error(error);
    res.status(400).send('상품 업로드 실패 하였습니다');
  });
});

app.get("/products/:id", (req, res) => {
  const { id } = req.params;
  models.Product.findOne({
    where: {
      id: id,
    }
  }).then((result)=>{
    console.log('PRODUCT: ', result);
    res.send({
      product:result
    })
  }).catch((error)=>{
    console.error(error)
    res.send("상품 조회가 에러 발생함")
  })
});

app.post('/image', upload.single('image'), (req, res) => {
  const file = req.file;
  res.send({
     imageUrl: file.path
  });
});

//회원가입
app.post('/users',async (req, res)=>{
  const body=req.body;
  const {user_id, pw, name, phone, email, birth, marketingChecked}=body;
  if(!user_id || !pw || !name || !phone || !email || !birth || !marketingChecked){
    res.send('모든 필드를 입력해주세요')
  }
  try{
    const existringUser= await models.User.findOne({where:{user_id}})
    if(existringUser){
      return res.status(400).send({success:false, messasge:'이미사용중인 아이디입니다.'})
    }
    const newUser = models.User.create({
      user_id,
      pw,
      name,
      phone,
      email,
      birth,
      marketingChecked
    });
    res.send({success: true, user: newUser})
  }catch(error){
    console.error(error)
    res.status(400).send('회원가입실패')
  }
 
})



// 로그인
app.post('/users/login', (req, res) => {
  const { user_id, pw } = req.body;

  models.User.findOne({ where: { user_id } })
    .then((result) => {
      if (result && result.pw === pw) {
        const user = { id: result.user_id, username: result.user_id };
        const accessToken = jwt.sign(user, secretKey, { expiresIn: '1h' });

        res.send({
          user: result.user_id,
          accessToken: accessToken,
        });
      } else {
        res.status(401).send({ message: '로그인 실패' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('서버 오류');
    });
});

app.post('/auth', (req, res) => {
  const body = req.body;
  const {accessToken} = body;

  if(!accessToken) {
     res.send(false);
  } else {
     try{
        const decoded = jwt.verify(accessToken, secretKey);
        if(decoded && decoded.exp > Math.floor(Date.now()/1000)){
           res.send({result: decoded});
        } else {
           res.send({result: "검증 실패"});
        };
     } catch(error){
        res.send({result: error});
     };
  };
});

//중복확인
app.get('/users/check-id', (req, res)=>{
  const {user_id}=req.query;

  if(!user_id){
    return res.status(400).send({success:false, message:'아이디를 입력해주세요'})
  }
  //데이터베이스에서 아이디 검색
  models.User.findOne({
    where: {user_id},
  }).then((user)=>{
    if(user){
      res.send({success:false, message:'이미 사용중인 아이디 입니다.'})
    }else{
      res.send({success:true, message:'사용가능한 아이디 입니다.'})
    }
  }).catch((error)=>{
    console.error(error);
    res.send({success:false, message:'서버 오류가 발생했습니다.'})
  })
})

//.sync()통해 db를 연결
app.listen(port, ()=>{
  console.log('펫샵 서버가 돌아가고 있습니다.')
  models.sequelize.sync()
  .then(()=>{
    console.log('DB연결 성공')
  })
  .catch((err)=>{
    console.error(err);
    console.log('DB연결 에러')
    process.exit();
  })
})
