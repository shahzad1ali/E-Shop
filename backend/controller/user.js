const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const { upload } = require("../multer");


const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const sendMail = require("../utils/sendMail");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const router = express.Router();

// CREATE USER
router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password, avatarUrl } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const user = { name, email, password, avatar: { url: avatarUrl || "" } };
    const activationToken = createActivationToken(user);
    const activationUrl = `https://e-shop-62ai.vercel.app/activation/${activationToken}`;

    await sendMail({
      email: user.email,
      subject: "Activate your account",
      message: `Hello ${user.name}, please click the link to activate your account: ${activationUrl}`,
    });

    res.status(201).json({
      success: true,
      message: `Please check your email (${user.email}) to activate your account.`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// CREATE ACTIVATION TOKEN
const createActivationToken = (user) => {
  return jwt.sign(
    {
      name: user.name,
      email: user.email,
      password: user.password,
      avatar: user.avatar,
    },
    process.env.ACTIVATION_SECRET,
    { expiresIn: "2h" }
  );
};

// ACTIVATE USER
router.post(
  "/activation",
  catchAsyncError(async (req, res, next) => {
    try {
      const { activation_token } = req.body;
      const decoded = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      let user = await User.findOne({ email: decoded.email });
      if (user) return next(new ErrorHandler("User already exists", 400));

      user = await User.create({
        name: decoded.name,
        email: decoded.email,
        password: decoded.password,
        avatar: decoded.avatar,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// LOGIN
router.post(
  "/login-user",
  catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Please provide all fields", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new ErrorHandler("User doesn't exist", 400));

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    sendToken(user, 201, res);
  })
);

//LOAD USER
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorHandler("User not found", 400));

    res.status(200).json({ success: true, user });
  })
);

//  LOGOUT 
router.get(
  "/logout",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.status(201).json({
      success: true,
      message: "Logout successfully",
    });
  })
);

//  UPDATE AVATAR
router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const { avatarUrl } = req.body; // frontend sends Cloudinary secure_url
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    user.avatar = { url: avatarUrl };
    await user.save();

    res.status(200).json({ success: true, user });
  })
);

// UPDATE USER INFO
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const { email, password, phoneNumber, name } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return next(new ErrorHandler("User not found", 400));

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new ErrorHandler("Invalid password", 400));
    }

    user.name = name;
    user.email = email;
    user.phoneNumber = phoneNumber;
    await user.save();

    res.status(201).json({ success: true, user });
  })
);

// UPDATE PASSWORD
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(new ErrorHandler("Passwords do not match", 400));
    }

    user.password = req.body.newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated" });
  })
);

// USER INFO BY ID
router.get(
  "/user-info/:id",
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    res.status(201).json({ success: true, user });
  })
);

// ADMIN ALL USER
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(201).json({ success: true, users });
  })
);

// DELETE USER ADMIN
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  })
);

module.exports = router;
 




  // const express = require("express");
// const path = require("path");
// const fs = require("fs");
// const jwt = require("jsonwebtoken");
// const catchAsyncError = require("../middleware/catchAsyncError");
// const sendToken = require("../utils/jwtToken");
// const router = express.Router();

// const User = require("../model/user");
// const ErrorHandler = require("../utils/ErrorHandler");
// const sendMail = require("../utils/sendMail");
// const { isAuthenticated, isAdmin } = require("../middleware/auth");

// const { upload } = require("../multer");
// const cloudinary = require("../config/cloudinary"); // ✅ now correct


// // crate user
// router.post("/create-user", upload.single("file"), async (req, resp, next) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return next(new ErrorHandler("Please provide all fields", 400));
//     }

//     if (!req.file) {
//       return next(new ErrorHandler("No file uploaded", 400));
//     }

//     // Convert file buffer to base64
//     const base64 = req.file.buffer.toString("base64");
//     const dataUri = `data:${req.file.mimetype};base64,${base64}`;

//     // Upload to Cloudinary
//     const result = await cloudinary.uploader.upload(dataUri, {
//       folder: "avatars",
//     });

//     const user = {
//       name,
//       email,
//       password,
//       avatar: {
//         public_id: result.public_id,
//         url: result.secure_url,
//       },
//     };

//     const activationToken = createActivationToken(user);
//     const activationUrl = `https://e-shop-62ai.vercel.app/activation/${activationToken}`;

//     await sendMail({
//       email: user.email,
//       subject: "Activate your account",
//       message: `Hello ${user.name}, please click the link to activate your account: ${activationUrl}`,
//     });

//     resp.status(201).json({
//       success: true,
//       message: `Please check your email (${user.email}) to activate your account.`,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });





// // router.post("/create-user", upload.single("file"), async (req, resp, next) => {
// //   try {
// //     console.log("REQ.BODY:", req.body);
// //     console.log("REQ.FILE:", req.file);
// //     const filename = req.file?.filename;
// //     console.log("upload file", filename);

// //     const { name, email, password } = req.body;
// //     const userEmail = await User.findOne({ email });

// //     if (userEmail) {
// //       const filename = req.file?.filename;

// //       if (filename) {
// //         const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
// //           req.file.filename
// //         }`;

// //         try {
// //           // Try to delete the uploaded file
// //           await fs.promises.unlink(filePath);
// //           console.log(`✅ Deleted file: ${filename}`);
// //         } catch (err) {
// //           console.error(`⚠️ Failed to delete file (${filename}):`, err.message);
// //         }
// //       } else {
// //         console.warn("⚠️ No file found to delete.");
// //       }

// //       return next(new ErrorHandler("User already exists", 400));
// //     }

// //     // const fileUrl = path.join("uploads", req.file.filename);
    

// //     // const user = {
// //     //   name,
// //     //   email,
// //     //   password,
// //     //   avatar: {
// //     //     url: fileUrl,
// //     //   },
// //     // };
    
// //      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
// //         folder: "avatars",
// //     })


// //     const user = {
// //         name: name,
// //         email: email,
// //         password: password,
// //         avatar: {
// //           // public_id: myCloud.public_id,
// //           url: myCloud.secure_url,
// //         },
// //     //     avatar:{
// //     //         url:fileUrl
// //     // }
// //   }

// //     const activationToken = createActivationToken(user);
// //     const activationUrl = `https://e-shop-62ai.vercel.app/activation/${activationToken}`;
    

// //     await sendMail({
// //       email: user.email,
// //       subject: "Activate your account",
// //       message: `Hello ${user.name}, please click the link to activate your account: ${activationUrl}`,
// //     });

// //     resp.status(201).json({
// //       success: true,
// //       message: `Please check your email (${user.email}) to activate your account.`,
// //     });
// //   } catch (error) {
// //     return next(new ErrorHandler(error.message, 500));
// //   }
// // });



// // CREATE ACTIVATION TOKEN


// const createActivationToken = (user) => {
//   return jwt.sign(
//     {
//       name: user.name,
//       email: user.email,
//       password: user.password,
//       avatar: user.avatar,
//     },
//     process.env.ACTIVATION_SECRET,
//     {
//       expiresIn: "2h",
//     }
//   );
// };

// // ACTIVATE OUR USER

// router.post(
//   "/activation",
//   catchAsyncError(async (req, resp, next) => {
//     const { activation_token } = req.body;

//     const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
//     console.log("Decoded token:", newUser);

//     try {
//       const newUser = jwt.verify(
//         activation_token,
//         process.env.ACTIVATION_SECRET
//       );
//       if (!newUser) {
//         return next(new ErrorHandler("Invalid Token"));
//       }
//       const { name, email, password, avatar } = newUser;
//       let user = await User.findOne({ email });
//       if (user) {
//         return next(new ErrorHandler("user already exists", 400));
//       }

//       user = await User.create({
//         name,
//         email,
//         avatar,
//         password,
//       });
//       sendToken(user, 201, resp);
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//     console.log("Decoded activation token:", newUser);
//     console.log("Token received:", activation_token);
//   })
// );

// // LOGIN USER

// router.post(
//   "/login-user",
//   catchAsyncError(async (req, resp, next) => {
//     try {
//       const { email, password } = req.body;
//       if (!email || !password) {
//         return next(new ErrorHandler("Please provide all feilda", 404));
//       }
//       const user = await User.findOne({ email }).select("+password");
//       if (!user) {
//         return next(new ErrorHandler("User dosn't esists!", 400));
//       }
//       const isPasswordValid = await user.comparePassword(password);
//       if (!isPasswordValid) {
//         return next(
//           new ErrorHandler("Please provide correct information", 400)
//         );
//       }

//       sendToken(user, 201, resp);
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // LOAD USER

// router.get(
//   "/getuser",
//   isAuthenticated,
//   catchAsyncError(async (req, resp, next) => {
//     try {
//       const user = await User.findById(req.user._id);

//       if (!user) {
//         return next(new ErrorHandler("User doen't exists", 400));
//       }
//       resp.status(200).json({
//         success: true,
//         user,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // LOGOUT METHOD

// router.get(
//   "/logout",
//   isAuthenticated,
//   catchAsyncError(async (req, resp, next) => {
//     try {
//       resp.cookie("token", null, {
//         expires: new Date(Date.now()),
//         httpOnly: true,
//          sameSite: "none",
//          secure: true,
        
//       });
//       resp.status(201).json({
//         success: true,
//         message: "Logout successfully",
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );