const fs = require('fs');

// Define <thead>, <tbody>, and warning vars to be filled later on.
var thead = document.getElementsByTagName('thead')[0],
    tbody = document.getElementsByTagName('tbody')[0],
    warning = document.getElementById('warning'),
    processingSection = document.getElementById('processing'),
    fileInputButton = document.getElementById('input-file'),
    fileInputList = document.getElementById('input-list'),
    outputButton = document.getElementById('csv-button'),
    outputFileName = document.getElementById('output-file');

var fileBuffer = [];

if (fs.existsSync(localStorage.path) && fs.statSync(localStorage.path).size > 0) {
    render(JSON.parse(fs.readFileSync(localStorage.path)));
} else {
    // Display "no data" warning if no data is found
    warning.style.display = 'block';
    processingSection.style.display = 'none';
}


function render(data) {
    // Make column headers.
    // Create <tr> element to put everything in.
    var tr = document.createElement('tr');
    // Go through the first data object
    for (prop in data[0]) {
        // Make a new table cell
        var th = document.createElement('th');
        // ...with the content of the prettified name of the property
        th.innerHTML = pname(prop);
        // Put it into the row
        tr.appendChild(th);
    }
    // Put the row into the table header
    thead.appendChild(tr);

    // For each object in the data array,
    for (pt in data) {
        // Make a new table row
        tr = document.createElement('tr');
        // Go through all properties
        for (prop in data[pt]) {
            // Make a table cell for each
            var td = document.createElement('td');
            // Fill table cell with that data property
            td.innerHTML = data[pt][prop];
            // Put the cell into the row
            tr.appendChild(td);
        }
        // Put this row into the document
        tbody.appendChild(tr);
    }
}

function pname(str) {
    var words = str.split('-');
    for (w in words) words[w] = words[w].charAt(0).toUpperCase() + words[w].slice(1);
    return words.join(' ');
}

fileInputButton.onclick = function() {
    fs.readdir(localStorage.desktopPath, (err, result) => {
        if (err) throw err;
        for (file of result) {
            if (file.endsWith('.json') && !fileBuffer.includes(file)) {
                var textElement = document.createElement('div');
                var element = document.createElement('li');
                textElement.textContent = file;
                textElement.alt = file;
                element.appendChild(textElement);
                element.className = 'generated';
                fileInputList.appendChild(element);

                fileBuffer.push(file);
            }
        }
    });
}

outputButton.onclick = function() {
    var content = makeCSV();
    var fd;
    try {
        fd = fs.openSync(localStorage.desktopPath + '/' + (outputFileName.value ? outputFileName.value : 'data') + '.csv', 'a');
        fs.appendFileSync(fd, content);
    } catch (err) {
        if (err) throw err;
    } finally {
        if (fd !== undefined)
            fs.closeSync(fd);
    }
    fileBuffer = [];
    fileInputList.innerHTML = '';
    outputFileName.value = '';
}

document.onclick = function(e) {
    if (Array.from(fileInputList.children).includes(e.target.parentElement)) {
        for (var i = 0; i < fileBuffer.length; i++) {
            if (fileBuffer[i] === e.target.textContent) {
                fileBuffer.splice(i--, 1);
            }
        }
        fileInputList.removeChild(e.target.parentElement);
    }
}

function makeCSV() {
    var data = combineFiles();

    const items = data;
    const replacer = (key, value) => value === null ? '' : value;
    const header = Object.keys(items[0]);
    let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');

    return csv;
}

function combineFiles() {
    var data = [];
    for (file of fileBuffer) {
        var contents = fs.readFileSync(localStorage.desktopPath + '/' + file);
        try {
            for (object of JSON.parse(contents)) {
                data.push(object);
            }
        } catch (err) {
            alert('File ' + file + ' has parsing errors. Resolve and run again.');
            continue;
        }
    }
    return data;
}
