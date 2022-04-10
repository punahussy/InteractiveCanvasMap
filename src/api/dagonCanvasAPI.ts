    //Работает только с png и jpg. Для вектора нужно написать отдельный метод
    //По идее должно работать и с gif, но не хочет
    export async function fetchImage(imgUrl: string) {
    const response = await fetch(imgUrl);
    const imageBlob = await response.blob();
    const imageObjectURL = URL.createObjectURL(imageBlob);
    let img = new Image();
    img.src = imageObjectURL;
    return img;
}