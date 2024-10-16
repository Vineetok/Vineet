const express=require("express");
const router=express.Router();

router.get("/",(req,res)=>{
    res.send("GET for users");
})

// Show
router.get("/:id",(req,res)=>{
    res.send("Get for users id");
})

// Post
router.post("/",(req,res)=>{
    res.send("POST for users");
})

// Delete
router.delete("/:id",(req,res)=>{
    res.send("Delete for user id");
})

module.exports=router;