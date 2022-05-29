const express = require('express')

const ffmpeg = require('fluent-ffmpeg');

const app = express()

const zip= require('adm-zip')

const multer= require('multer')

const fs= require('fs')

const path= require('path')

const {exec}= require('child_process');
const admZip = require('adm-zip');

app.use(express.static('public'))

var dir= 'public'

var subDir= 'public/uploads'

if(!fs.existsSync(dir)){
    fs.mkdirSync(dir)

    fs.mkdirSync(subDir)
}

var storage= multer.diskStorage({
    destination:function (req,file,cb) {
        cb(null,'public/uploads')
    },
    filename:function(req,file,cb){
        cb(null,file.fieldname+ '-'+ Date.now()+ path.extname(file.originalname))
    }
})

var upload= multer({storage:storage})

const PORT=  process.env.PORT || 3000

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/home.html')
})

app.post('/convert',upload.single('file'),(req,res)=>{
   if(req.file){
       console.log(req.file.path)

       const videoFile= req.file.path

       ffmpeg.ffprobe(videoFile,(err,metaData)=>{
     
        const dur = metaData.format.duration;
        const count= Math.ceil(dur/15)
        const arr=[]
        const fileNames=[]
       
        var sec=0;
        var min=0;
        var hour=0;
        var duration=15;
        for(var start=0;start<dur;start=start+15){
            var output=Date.now()+'.mp4'
            fileNames.push(output)
           sec= parseInt(start%60);
           min= parseInt(start/60);
           hour= parseInt(hour/3600);
          var startingTime=hour.toString()+":"+min.toString()+":"+sec.toString();
           console.log(startingTime);
           if(duration>dur-start){
             duration= parseInt(dur-start);
           }
           console.log(duration);
          ffmpeg()
          .input(videoFile)
          .setStartTime(startingTime)
          .setDuration(duration.toString())
          .output(output)
          .on('end',()=> {
              console.log("Done!")
              arr.push('done')
              if(arr.length===count){
                var zip= new admZip()
                for(let i=0;i<count;i++){
                    zip.addLocalFile(fileNames[i])
                }
                var outputfile= "splitted.zip"
                fs.writeFileSync(outputfile,zip.toBuffer());
                res.download(outputfile,(err)=>{
                    if(err) {
                        console.log(err)
                    }
                    for(let i=0;i<count;i++){
                        fs.unlinkSync(fileNames[i])
                    }
                    fs.unlinkSync(outputfile)
                    fs.unlinkSync(videoFile)
                })
                
              }
            
            
            })
          .on('error',(err)=> console.error(err))
          .run();
        }
        
    });

    
   }
   console.log('done splitting')
})

app.listen(PORT,()=>{
    console.log(`App is listening on ${PORT}`)
})