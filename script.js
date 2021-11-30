function readData() {
    errorMessage.innerHTML = "";
    settings.width = Number.parseInt(document.getElementById("widthInput").value);
    settings.height = Number.parseInt(document.getElementById("heightInput").value);
    settings.selectedInventory = document.getElementById("inventorySelect").value;
    settings.generateTable = document.getElementById("generateTable").checked;
    if (!settings.selectedInventory) {
        errorMessage.innerHTML = "Please select a set"
        return;
    }
    const file = document.getElementById("fileInput").files[0];
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            pixelReaderCanvas = document.createElement("canvas");
            pixelReaderCtx = pixelReaderCanvas.getContext("2d");
            pixelReaderCanvas.width = img.width;
            pixelReaderCanvas.height = img.height;
            pixelReaderCtx.drawImage(img, 0, 0, settings.width, settings.height);
            imageData = pixelReaderCtx.getImageData(0, 0, settings.width, settings.height).data;
            constructMosaic(imageData);
        }
    }
    reader.readAsDataURL(file);
}
function sleep(t, msg="") {
    const startTime = Date.now();
    while (startTime + t > Date.now()) {}
    console.log(msg);
    return;
}
function minIndex(arr) {
    index = 0;
    min = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < min) {
            index = i;
            min = arr[i];
        }
    }
    return index;
}
function arrayDeepCopy(arr) {
    let output = [];
    for (let i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            output.push(arrayDeepCopy(arr[i]));
        } else {
            output.push(arr[i]);
        }
    }
    return output;
}
function constructMosaic(imageData) {
    const colorComparisons = [];
    const inventory = arrayDeepCopy(setInventories[settings.selectedInventory]);
    const colorAmount = inventory.length;
    let partsTotal = 0;
    for (let i = 0; i < colorAmount; i++) {
        let color = colorDefinitions[inventory[i][0]][1];
        partsTotal += inventory[i][1];
        colorComparisons.push([]);
        for (let y = 0; y < settings.height; y++) {
            for (let x = 0; x < settings.width; x++) {
                colorComparisons[i].push(
                    Math.abs(imageData[4 * (settings.width * y + x)] - color[0]) + 
                    Math.abs(imageData[4 * (settings.width * y + x) + 1] - color[1]) + 
                    Math.abs(imageData[4 * (settings.width * y + x) + 2] - color[2])
                );
            }
        }
    }
    if (partsTotal < settings.width * settings.height) {
        errorMessage.innerHTML = `Not enough parts for size of mosaic (${partsTotal} available, ${settings.width * settings.height} required)`;
        return;
    }
    let assignedParts = 0;
    let totalParts = settings.width * settings.height;
    let parts = [];
    for (let i = 0; i < totalParts; i++) {
        parts.push(-1);
    }
    let currentPartIndex = 0;
    let score = 0;
    while (assignedParts < totalParts) {
        let pixelIndex = minIndex(colorComparisons[currentPartIndex]);
        let partIndex = currentPartIndex;
        let minVal = colorComparisons[0][pixelIndex];
        for (let i = 0; i < colorAmount; i++) {
            if (colorComparisons[i][pixelIndex] < minVal && inventory[i][1] > 0) {
                minVal = colorComparisons[i][pixelIndex];
                partIndex = i;
            }
        }
        parts[pixelIndex] = inventory[partIndex][0];
        inventory[partIndex][1]--;
        score += colorComparisons[partIndex][pixelIndex];
        for (let i = 0; i < colorAmount; i++) {
            colorComparisons[i][pixelIndex] = 3 * 255;
        }
        currentPartIndex = (inventory[partIndex][1] > 0 ? partIndex : 0);
        assignedParts++;
    }
    const table = document.getElementById("colorTable");
    colorTable.innerHTML = "";
    outputCanvas.width = 10 * settings.width;
    outputCanvas.height = 10 * settings.height;
    for (let i = 0; i < parts.length; i++) {
        let color = colorDefinitions[parts[i]][1];
        let x = i % settings.width;
        let y = Math.floor(i / settings.width);
        if (x == 0) {
            table.appendChild(document.createElement("tr"));
        }
        if (settings.generateTable) {
            let td = document.createElement("td");
            td.innerHTML = parts[i];
            td.style.background = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            td.style.color = (color[0] + color[1] + color[2]) < 350 ? "white" : "black";
            table.lastChild.appendChild(td);    
        }
        outputCtx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        outputCtx.fillRect(x * 10, y * 10, 10, 10);
    }
    console.log(1 - score / (settings.width * settings.height * 3 * 255));
}
const errorMessage = document.getElementById("errorMessage");
const outputCanvas = document.getElementById("outputCanvas");
const outputCtx = outputCanvas.getContext("2d");
let settings = {
    width: 48,
    height: 48,
    selectedInventory: undefined,
    generateTable: false
};
const setInventories = {
    "21226": [['11', 254], ['36', 148], ['110', 163], ['103', 119], ['104', 58], ['153', 127], ['63', 660], ['152', 317], ['34', 166], ['150', 281], ['4', 133], ['5', 190], ['88', 307], ['2', 241], ['1', 474], ['3', 299]],
    "31197": [['11', 629], ['104', 587], ['85', 131], ['47', 587], ['71', 46], ['156', 587], ['3', 587]],
    "31198": [['11', 698], ['105', 57], ['110', 65], ['63', 121], ['85', 141], ['120', 554], ['68', 85], ['69', 137], ['86', 51], ['150', 29], ['4', 74], ['88', 250], ['55', 52], ['2', 283], ['1', 149]],
    "31199": [['11', 476], ['63', 529], ['85', 91], ['120', 196], ['68', 162], ['59', 214], ['69', 97], ['86', 31], ['150', 208], ['115', 232], ['5', 308], ['88', 191], ['55', 23], ['2', 155], ['1', 61]],
    "31200": [['11', 877], ['103', 92], ['63', 447], ['85', 151], ['120', 200], ['59', 328], ['86', 110], ['4', 125], ['77', 271], ['5', 286], ['55', 139], ['1', 187]],
    "31201": [['11', 593], ['7', 431], ['36', 4], ['59', 503], ['95', 630], ['6', 499], ['86', 236], ['156', 10], ['77', 153], ['115', 604], ['5', 15], ['1', 369]],
    "31202": [['11', 662], ['63', 409], ['85', 79], ['120', 76], ['59', 96], ['86', 59], ['5', 213], ['2', 32], ['1', 835]],
    "31203": [['36', 601], ['110', 599], ['63', 393], ['39', 1879], ['34', 1060], ['156', 1607], ['4', 601], ['2', 725]],
    "41935": [['11', 60], ['7', 120], ['36', 20], ['103', 20], ['63', 40], ['80', 20], ['89', 60], ['39', 120], ['154', 40], ['152', 40], ['71', 40], ['156', 40], ['4', 40], ['5', 40], ['48', 20], ['1', 60], ['3', 120]] 
}
const colorDefinitions = {
    "11": ["Black", [4, 18, 28]],
    "7": ["Blue", [0, 84, 190]],
    "6": ["Green", [36, 121, 61]],
    "39": ["Dark Turquoise", [0, 130, 142]],
    "5": ["Red", [200, 25, 8]],
    "47": ["Dark Pink", [199, 111, 159]],
    "8": ["Brown", [87, 56, 38]],
    "9": ["Light Gray", [154, 160, 156]],
    "10": ["Dark Gray", [108, 109, 91]],
    "62": ["Light Blue", [179, 209, 226]],
    "36": ["Bright Green", [74, 158, 73]],
    "40": ["Light Turquoise", [84, 164, 174]],
    "25": ["Salmon", [241, 111, 93]],
    "23": ["Pink", [251, 150, 171]],
    "3": ["Yellow", [241, 204, 54]],
    "1": ["White", [254, 254, 254]],
    "38": ["Light Green", [193, 217, 183]],
    "33": ["Light Yellow", [250, 229, 149]],
    "2": ["Tan", [227, 204, 157]],
    "44": ["Light Violet", [200, 201, 225]],
    "46": ["Glow in Dark Opaque", [223, 254, 175]],
    "24": ["Purple", [128, 0, 122]],
    "109": ["Dark Blue-Violet", [31, 49, 175]],
    "4": ["Orange", [253, 137, 23]],
    "71": ["Magenta", [145, 56, 119]],
    "34": ["Lime", [186, 232, 10]],
    "69": ["Dark Tan", [148, 137, 114]],
    "104": ["Bright Pink", [227, 172, 199]],
    "157": ["Medium Lavender", [171, 119, 185]],
    "154": ["Lavender", [224, 212, 236]],
    "14": ["Trans-Dark Blue", [0, 31, 159]],
    "20": ["Trans-Green", [34, 119, 64]],
    "108": ["Trans-Bright Green", [85, 229, 69]],
    "17": ["Trans-Red", [200, 25, 8]],
    "50": ["Trans-Dark Pink", [222, 101, 148]],
    "18": ["Trans-Neon Orange", [254, 127, 12]],
    "113": ["Trans-Very Lt Blue", [192, 222, 239]],
    "13": ["Trans-Black", [98, 94, 81]],
    "74": ["Trans-Medium Blue", [84, 153, 182]],
    "16": ["Trans-Neon Green", [191, 254, 0]],
    "15": ["Trans-Light Blue", [173, 232, 238]],
    "114": ["Trans-Light Purple", [149, 111, 158]],
    "107": ["Trans-Pink", [251, 150, 171]],
    "19": ["Trans-Yellow", [244, 204, 46]],
    "12": ["Trans-Clear", [251, 251, 251]],
    "51": ["Trans-Purple", [164, 164, 202]],
    "121": ["Trans-Neon Yellow", [217, 175, 0]],
    "98": ["Trans-Orange", [239, 142, 27]],
    "57": ["Chrome Antique Brass", [99, 89, 75]],
    "52": ["Chrome Blue", [107, 149, 190]],
    "64": ["Chrome Green", [59, 178, 112]],
    "82": ["Chrome Pink", [169, 76, 141]],
    "122": ["Chrome Black", [26, 41, 51]],
    "96": ["Very Light Orange", [242, 206, 154]],
    "93": ["Light Purple", [204, 97, 151]],
    "88": ["Reddish Brown", [87, 41, 17]],
    "86": ["Light Bluish Gray", [159, 164, 168]],
    "85": ["Dark Bluish Gray", [107, 109, 103]],
    "42": ["Medium Blue", [91, 156, 208]],
    "37": ["Medium Green", [114, 219, 160]],
    "116": ["Speckle Black-Copper", [0, 0, 0]],
    "117": ["Speckle DBGray-Silver", [98, 94, 96]],
    "56": ["Light Pink", [253, 203, 206]],
    "90": ["Light Flesh", [245, 214, 178]],
    "60": ["Milky White", [254, 254, 254]],
    "67": ["Metallic Silver", [164, 168, 179]],
    "70": ["Metallic Green", [136, 154, 94]],
    "65": ["Metallic Gold", [218, 171, 51]],
    "150": ["Medium Dark Flesh", [203, 111, 41]],
    "89": ["Dark Purple", [62, 53, 144]],
    "91": ["Dark Flesh", [123, 79, 57]],
    "97": ["Blue-Violet", [75, 96, 218]],
    "28": ["Flesh", [207, 144, 103]],
    "26": ["Light Salmon", [253, 185, 188]],
    "43": ["Violet", [66, 83, 162]],
    "73": ["Medium Violet", [103, 115, 201]],
    "100": ["Glitter Trans-Dark Pink", [223, 102, 149]],
    "76": ["Medium Lime", [198, 209, 59]],
    "101": ["Glitter Trans-Clear", [254, 254, 254]],
    "41": ["Aqua", [178, 214, 208]],
    "35": ["Light Lime", [226, 219, 95]],
    "32": ["Light Orange", [248, 185, 96]],
    "102": ["Glitter Trans-Purple", [99, 0, 96]],
    "111": ["Speckle Black-Silver", [0, 0, 0]],
    "151": ["Speckle Black-Gold", [0, 0, 0]],
    "84": ["Copper", [149, 73, 38]],
    "66": ["Pearl Light Gray", [155, 162, 167]],
    "78": ["Metal Blue", [85, 118, 185]],
    "61": ["Pearl Light Gold", [219, 189, 96]],
    "77": ["Pearl Dark Gray", [86, 87, 86]],
    "119": ["Pearl Very Light Gray", [186, 188, 187]],
    "99": ["Very Light Bluish Gray", [229, 226, 223]],
    "81": ["Flat Dark Gold", [179, 135, 61]],
    "95": ["Flat Silver", [136, 134, 135]],
    "83": ["Pearl White", [241, 242, 241]],
    "110": ["Bright Light Orange", [247, 186, 60]],
    "105": ["Bright Light Blue", [133, 192, 224]],
    "27": ["Rust", [178, 15, 3]],
    "103": ["Bright Light Yellow", [254, 239, 57]],
    "87": ["Sky Blue", [85, 189, 213]],
    "63": ["Dark Blue", [12, 49, 90]],
    "80": ["Dark Green", [23, 69, 49]],
    "118": ["Glow In Dark Trans", [188, 197, 172]],
    "115": ["Pearl Gold", [203, 155, 42]],
    "120": ["Dark Brown", [68, 40, 0]],
    "72": ["Maersk Blue", [83, 168, 199]],
    "59": ["Dark Red", [113, 13, 14]],
    "153": ["Dark Azure", [19, 151, 214]],
    "156": ["Medium Azure", [61, 193, 220]],
    "152": ["Light Aqua", [188, 219, 215]],
    "158": ["Yellowish Green", [222, 237, 164]],
    "155": ["Olive Green", [154, 153, 89]],
    "21": ["Chrome Gold", [186, 164, 60]],
    "58": ["Sand Red", [213, 116, 113]],
    "94": ["Medium Dark Pink", [246, 132, 176]],
    "29": ["Earth Orange", [249, 155, 27]],
    "54": ["Sand Purple", [131, 93, 131]],
    "48": ["Sand Green", [159, 187, 171]],
    "55": ["Sand Blue", [88, 112, 131]],
    "22": ["Chrome Silver", [223, 223, 223]],
    "106": ["Fabuland Brown", [182, 123, 80]],
    "31": ["Medium Orange", [254, 166, 10]],
    "68": ["Dark Orange", [168, 84, 0]],
    "49": ["Very Light Gray", [229, 226, 217]],
    "159": ["Glow In Dark White", [236, 236, 236]],
    "160": ["Fabuland Orange ", [214, 146, 61]],
    "161": ["Dark Yellow", [229, 182, 53]],
    "162": ["Glitter Trans-Light Blue ", [174, 233, 239]],
    "163": ["Glitter Trans-Neon Green", [192, 255, 0]],
    "164": ["Trans-Light Orange", [240, 164, 35]],
    "165": ["Neon Orange", [255, 112, 82]],
    "220": ["Coral", [255, 117, 117]],
    "166": ["Neon Green", [188, 239, 102]],
    "221": ["Trans-Light Green", [148, 229, 171]]
}