const express = require("express");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/jwtToken");
const router = express.Router();

const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const sendMail = require("../utils/sendMail");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

const { upload } = require("../multer");
const cloudinary = require("../config/cloudinary"); // ✅ now correct


// CREATE USER
router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new ErrorHandler("Please provide all fields", 400));
    }

    if (!req.file) {
      return next(new ErrorHandler("No file uploaded", 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Clean up Cloudinary upload
      await cloudinary.uploader.destroy(req.file.filename, { resource_type: "image" }).catch(console.error);
      return next(new ErrorHandler("User already exists", 400));
    }

    // Convert file buffer to base64
    const base64 = req.file.buffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "avatars",
      resource_type: "image",
    });

    const userData = {
      name,
      email,
      password,
      avatar: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    };

    const activationToken = createActivationToken(userData);
    const activationUrl = `https://e-shop-62ai.vercel.app/activation/${activationToken}`;

    await sendMail({
      email: userData.email,
      subject: "Activate your account",
      message: `Hello ${userData.name}, please click the link to activate your account: ${activationUrl}`,
    });

    res.status(201).json({
      success: true,
      message: `Please check your email (${userData.email}) to activate your account.`,
    });
  } catch (error) {
    // Clean up Cloudinary on error
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename, { resource_type: "image" }).catch(console.error);
    }
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
    {
      expiresIn: "2h",
    }
  );
};

// ACTIVATE USER (Changed to GET for email link compatibility)
router.get(
  "/activation/:activation_token",
  catchAsyncError(async (req, res, next) => {
    try {
      const { activation_token } = req.params;
      console.log("Token received:", activation_token);

      const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
      console.log("Decoded activation token:", newUser);

      const { name, email, password, avatar } = newUser;

      let user = await User.findOne({ email });
      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }

      user = await User.create({
        name,
        email,
        password, // Will be hashed by schema's pre-save hook
        avatar,
      });

      sendToken(user, 201, res);
    } catch (error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return next(new ErrorHandler("Invalid or expired token", 400));
      }
      return next(new ErrorHandler(error.message, 500));
    }
  })
);







// // create user
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

// LOGIN USER

router.post(
  "/login-user",
  catchAsyncError(async (req, resp, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new ErrorHandler("Please provide all feilda", 404));
      }
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("User dosn't esists!", 400));
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide correct information", 400)
        );
      }

      sendToken(user, 201, resp);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// LOAD USER

router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncError(async (req, resp, next) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return next(new ErrorHandler("User doen't exists", 400));
      }
      resp.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// LOGOUT METHOD

router.get(
  "/logout",
  isAuthenticated,
  catchAsyncError(async (req, resp, next) => {
    try {
      resp.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
         sameSite: "none",
         secure: true,
        
      });
      resp.status(201).json({
        success: true,
        message: "Logout successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar

router.put(
  "/update-avatar",
  isAuthenticated,
  upload.single("image"),
  catchAsyncError(async (req, res, next) => {
    try {
      const existsUser = await User.findById(req.user.id);

      // If old avatar exists, delete it
      if (existsUser.avatar && existsUser.avatar.url) {
        const oldPath = path.join(__dirname, "..", existsUser.avatar.url);
        try {
          fs.unlinkSync(oldPath);
          console.log("✅ Old avatar deleted:", oldPath);
        } catch (err) {
          console.warn("⚠️ Could not delete old avatar:", err.message);
        }
      }

      // Save new avatar
      const fileUrl = path.join("uploads", req.file.filename);
      existsUser.avatar = { url: fileUrl };
      await existsUser.save();

      res.status(200).json({
        success: true,
        user: existsUser,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//update user address
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exist`)
        );
      }

      const existAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existAddress) {
        Object.assign(existAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncError(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id.replace(/^:/, "");

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );
      const user = await User.findById(userId);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user password
 router.put('/update-user-password', isAuthenticated, catchAsyncError(async(req,res,next) => {
  try {
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatched){
      return next(new ErrorHandler("old password is incorrect", 400))
    }
    if(req.body.newPassword !== req.body.confirmPassword){
      return next(new ErrorHandler(" password does not matched", 400))    
    }
    user.password = req.body.newPassword;
    await user.save()

  res.status(200).json({
    success:true,
    message: "Password matched successfully!"
  })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
 }))


 // find user information with userid

 router.get("/user-info/:id", catchAsyncError(async(req,res,next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(201).json({
      success: true,
      user
    })
  } catch (error) {
        return next(new ErrorHandler(error.message, 500));
  }
 }))



 // all users -- for admin
 router.get(
   "/admin-all-users",
   isAuthenticated,
   isAdmin("Admin"),
   catchAsyncError(async (req, res, next) => {
     try {
       const users = await User.find().sort({
         createdAt: -1,
       });
       res.status(201).json({
         success: true,
         users,
       });
     } catch (error) {
       return next(new ErrorHandler(error.message, 500));
     }
   })
 );
 
// delete user (Admin only)
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncError(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id); // 👈 FIX: use req.params.id
      if (!user) {
        return next(new ErrorHandler("User not found with this id", 404));
      }

      await User.findByIdAndDelete(req.params.id); // 👈 delete by param id

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


  module.exports = router;
 