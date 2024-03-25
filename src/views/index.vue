<template>
  <div class="container">
    <UploadFile @change="changeFile" />
    <img src="../../src//assets/imgBackground-1.png" id="image1" />
    <img src="../../src//assets/imgBackground-2.png" id="image2" />
    <img src="../../src//assets/imgBackground-3.png" id="image3" />
    <div class="form">
      <button
        @click="imgToVideo"
        class="form-btn"
        :disabled="imgs.length > 0 ? false : true"
      >
        {{ imgs.length > 0 ? "合成视频" : "☝️请上传(PNG)图片" }}
      </button>
      <input
        class="form-input"
        v-model="frameNumber"
        type="number"
        placeholder="设置帧数(默认1)"
      />
    </div>
    <p class="text" v-if="loggerText">
      {{ isFinish ? "合成视频完成" : loggerText }}
    </p>
    <template v-if="videoUrl">
      <video class="main" :src="videoUrl" controls></video>
      <button class="download" @click="downloadVideo">下载视频</button>
    </template>
  </div>
</template>
<script setup>
import { onMounted, ref } from "vue";
import UploadFile from "@/components/UploadFile.vue";
import FFmpeg from "@ffmpeg/ffmpeg";
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false });

const imgs = ref([]);
const videoBg = ref({});
const changeFile = (e) => {
  imgs.value = e.imgs;
  videoBg.value = e.videoBg;
};

const videoUrl = ref(""); //视频链接
const loggerText = ref(""); //合成日志
const isFinish = ref(true); // 是否合成完成
const frameNumber = ref(""); // 帧数

const dataURItoBlob = (dataURI) => {
  let arr = dataURI.split(",");
  let mime = arr[0].match(/:(.*?);/)[1];
  let bstr = atob(arr[1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {
    type: mime,
  });
};
const blobToFile = (theBlob, fileName) => {
  theBlob.lastModifiedDate = new Date();
  theBlob.name = fileName;
  return theBlob;
};

onMounted(async () => {
  setTimeout(() => {
    for (let item of [1, 2, 3]) {
      // 创建一个Canvas元素
      var canvas = document.createElement("canvas");
      canvas.width = 400; // 设置Canvas宽度
      canvas.height = 300; // 设置Canvas高度
      var ctx = canvas.getContext("2d");

      const imageSrc = document.getElementById(`image${item}`).src;
      // 在Canvas上绘制内容
      const image = new Image();
      image.onload = async () => {
        ctx.drawImage(image, 0, 0);

        // const imgsrc = canvas.toDataURL("image/png"); // 截取后的视频封面
        // console.log('imgsrc --->')
        // let file = blobToFile(dataURItoBlob(imgsrc), `file-${item}`);
        // imgs.value.push(file);

        // // 这里可以对file进行后续操作，比如上传到服务器等
        // console.log("File generated:", file);
        // 将Canvas转换为Blob对象
        canvas.toBlob(function (blob) {
          // 创建一个File对象
          var file = new File([blob], `canvas_image${item}.png`, {
            type: "image/png",
          });

          imgs.value.push(file);

          // 这里可以对file进行后续操作，比如上传到服务器等
          console.log("File generated:", file);
        });
      };
      image.src = imageSrc;
    }
  }, 5000);
});

const imgToVideo = async () => {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  for (let i in imgs.value) {
    console.log("i --->", i);
    ffmpeg.FS("writeFile", `${i}.png`, await fetchFile(imgs.value[i]));
  }

  // 读取进度
  ffmpeg.setProgress(({ ratio }) => {
    isFinish.value = ratio == 1 ? true : false;
  });
  // 读取消息日志
  ffmpeg.setLogger((res) => {
    loggerText.value = res.message;
  });

  const count = frameNumber.value.toString() || "1"; //视频帧数
  const time = (imgs.value.length / count).toString(); //视频时长,不刻意设置也能符合预期，只是重新合成视频会是之前的时长

  if (videoBg.value["name"]) {
    const videoBgName = encodeURI(videoBg.value.name); //处理中文命名的音乐文件，会报错
    ffmpeg.FS("writeFile", videoBgName, await fetchFile(videoBg.value));
    await ffmpeg.run(
      "-r",
      count,
      "-f",
      "image2",
      "-i",
      "%d.png",
      "-i",
      videoBgName,
      "-t",
      time,
      "video.mp4"
    );
  } else {
    await ffmpeg.run(
      "-r",
      count,
      "-f",
      "image2",
      "-i",
      "%d.png",
      "-t",
      time,
      "video.mp4"
    );
  }
  const data = ffmpeg.FS("readFile", "video.mp4");
  videoUrl.value = URL.createObjectURL(
    new Blob([data.buffer], { type: "video/mp4" })
  );
};

const downloadVideo = () => {
  const request = new XMLHttpRequest();
  request.open("GET", videoUrl.value);
  request.responseType = "blob";
  request.onload = (res) => {
    if (res.target.status == 200) {
      const url = window.URL.createObjectURL(res.currentTarget.response);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${new Date().getTime()}.mp4`);
      link.click();
    }
  };
  request.send();
};
</script>
<style lang="less">
.container {
  padding: 30px;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}

.form {
  display: flex;
  align-items: center;
  margin-top: 30px;

  &-btn {
    color: #fff;
    background-color: #f50057;
    font-size: 14px;
    border-radius: 4px;
    height: 36px;
    padding: 5px 15px;
  }

  &-input {
    color: #fff;
    font-size: 14px;
    border-radius: 4px;
    height: 36px;
    padding: 5px 15px;
    outline: unset;
    border: 1px solid #f50057;
    width: 135px;
    margin-left: 10px;
    background: transparent;

    &::-webkit-input-placeholder {
      color: #999;
    }

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }

    &[type="number"] {
      -moz-appearance: textfield;
    }
  }
}

.main {
  max-width: 350px;
  margin-top: 35px;
}

.download {
  border: 1px solid #f50057;
  color: #f50057;
  font-size: 14px;
  border-radius: 4px;
  height: 36px;
  padding: 5px 15px;
  margin-top: 10px;
}

.text {
  margin-top: 10px;
}
</style>
