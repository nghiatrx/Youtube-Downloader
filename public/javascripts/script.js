
function request(url, method, data, done, fail) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            if (done != null) done(this.responseText);
        } else if (this.status >= 400 && this.status <= 599){
            if (fail != null) fail();
        }
    };
    xhttp.open(method, url, true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(data);
}

var isRequesting = false;

function generateInfoClick() {

    if (isRequesting) return true;
    isRequesting = true;

    document.getElementById("result").className = "hidden";
    var youtubeUrl = document.getElementById('youtubeUrlInput').value;
    if (youtubeUrl.indexOf('youtube.com') == -1) {
        document.getElementById('youtubeUrlInput').className = document.getElementById('youtubeUrlInput').className + " input-invalid";
        isRequesting = false;
        return;
    } else {
        document.getElementById('youtubeUrlInput').className = document.getElementById('youtubeUrlInput').className.replace(' input-invalid', '');
    }


    document.getElementById('imgLoading').className = '';
    
    ga('send', 'event', {
        eventCategory: 'generateInfoClick',
        eventAction: 'click'
    });

    request('/ydl', 'POST', 'youtubeUrl=' + youtubeUrl, function(res){

        isRequesting = false;

        if (res == 'error') {
            isRequesting = false;
            document.getElementById('cantGetVideo').className = document.getElementById('cantGetVideo').className.replace(' hidden', '');
            return;
        }
        if (document.getElementById('cantGetVideo').className.indexOf('hidden') == -1) document.getElementById('cantGetVideo').className = document.getElementById('cantGetVideo').className + ' hidden';
        document.getElementById("result").className = "";
        var obj = JSON.parse(res);
        document.getElementById('videoInfo').value = 'Title: ' + obj.title + '\nAuthor: ' + obj.author + '\nView count: ' + obj.view_count;
        document.getElementById('videoImg').src = obj.img;
        var links = obj.links;
        var selectHtml = '';
        var qualityDuplicate = {};
        var hiddenInputHtml = '';

        for (var i = 0, l = links.length; i < l; i++) {
            if (qualityDuplicate[links[i].quality] == null) {
                selectHtml += '<option value="' + i + '">' + links[i].quality  +'</option>';
                qualityDuplicate[links[i].quality] = 1;
            } else {
                selectHtml += '<option value="' + i + '">' + links[i].quality + '_' + qualityDuplicate[links[i].quality]  +'</option>';
                qualityDuplicate[links[i].quality]++;
            }
            hiddenInputHtml += '<input type="hidden" id="hiddenLink_' + i + '" value="' +  links[i].url  + '" />';
            
        }
        
        hiddenInputHtml += '<input type="hidden" id="hiddenTitle_' + '" value="' +  obj.title  + '" />';

        document.getElementById('qualitySelect').innerHTML = selectHtml;
        document.getElementById('resultHidden').innerHTML = hiddenInputHtml;

        setDownloadA(links[0].url, obj.title);

        document.getElementById('imgLoading').className = 'hidden';

    }, function() {
        document.getElementById("result").className = "hidden";
        document.getElementById('imgLoading').className = 'hidden';
        isRequesting = false;
    });
}

function setDownloadA(url, title) {
    var a = document.getElementById('downloadA');
    a.href = url;
    a.download = title;
    a.title = title;
}

function qualitySelectChange() {
    var quality =  document.getElementById('qualitySelect').value;
    var url = document.getElementById('hiddenLink_' + quality).value;   
    var title = document.getElementById('hiddenTitle_').value; 
    setDownloadA(url, title);
}

function urlInputKeyPress(event) {
    if (event.charCode == 13) {
        document.getElementById("generateInfo").click();
    }
}

function urlInputPaste() {
    setTimeout(function() {
        document.getElementById("generateInfo").click();
    }, 200);
}

// Google Analytic
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-85518523-1', 'auto');
ga('send', 'pageview');

