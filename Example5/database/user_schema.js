const crypto = require('crypto');

const Schema = {};

//Schema의 속성으로 추가
Schema.createSchema = function (mongoose) {
  //스키마 정의
  let UserSchema = mongoose.Schema({
    //unique 속성을 사용하면 자동으로 index 생성
    //password대신 암호화 된 hashed_password 사용, 암호화 키값인 salt 사용
    id: { type: String, required: true, unique: true, 'default': ' ' },
    hashed_password: { type: String, required: true, 'default': ' ' },
    salt: { type: String, required: true },
    name: { type: String, index: 'hashed', 'default': ' ' },
    age: { type: Number, 'default': -1 },
    created_at: { type: Date, index: { unique: false }, 'default': Date.now },
    updated_at: { type: Date, index: { unique: false }, 'default': Date.now }
  });

  //password를 virtual 메소드로 정의 : MongoDB에 저장되지 않는 속성
  UserSchema.virtual('password')
    .set(function (password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
      console.log('virtual password 호출됨. : ' + this.hashed_password);
    })
    .get(function () { return this._password });

  //모델 인스턴스에서 사용할 수 메소드 추가
  //비밀번호와 salt값을 전달받은 후 sha256으로 단방향 암호화하는 메소드
  UserSchema.method('encryptPassword', function (plainText, inSalt) {
    if (inSalt) {
      return crypto.createHmac('sha256', inSalt).update(plainText).digest('hex');
    }
    else {
      return crypto.createHmac('sha256', this.salt).update(plainText).digest('hex');
    }
  });

  //salt값 생성 메소드
  UserSchema.method('makeSalt', function () {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  //인증 메소드
  UserSchema.method('authenticate', function (plainText, inSalt, hashed_password) {
    if (inSalt) {
      console.log('authenticate 호출됨. : %s -> %s : %s', plainText,
        this.encryptPassword(plainText, inSalt), hashed_password);
      return this.encryptPassword(plainText, inSalt) == hashed_password;
    }
    else {
      console.log('authenticate 호출됨. : %s -> %s : %s', plainText,
        this.encryptPassword(plainText), hashed_password);
      return this.encryptPassword(plainText) == hashed_password;
    }
  });

  //필수 속성에 대한 유효성 확인
  UserSchema.path('id').validate(function (id) {
    return id.length;
  }, 'id 칼럼 값이 없습니다.');

  UserSchema.path('name').validate(function (name) {
    return name.length;
  }, 'name 칼럼 값이 없습니다.');

   //스키마에 static 메소드 추가, 모델 객체에서 사용가능(모델 인스턴스에서 사용하려면 method()로 정의)
  //ID로 조회, 전부 조회
  UserSchema.static('findById', function (id, callback) {
    return this.find({ id: id }, callback);
  });

  UserSchema.static('findAll', function (callback) {
    return this.find({}, callback);
  });

  console.log('UserSchema 정의함.');
  return UserSchema;
};

//module.exports에 Schema 객체 할당
module.exports = Schema;

