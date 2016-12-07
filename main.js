const electron = require('electron');
const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;
var spawn = require('child_process').spawn;


var client = require('cheerio-httpcli');
var url = "http://www.tenki.jp/lite/forecast/3/16/4410/13101-daily.html";
var force_quit = false;


app.dock.hide();
const {BrowserWindow} = require('electron');


app.on('ready', function () {
    appIcon = new Tray(__dirname + '/images/cloud.png');
    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'Reload', type: 'normal', click: function () {
            scrape()
        }
        },
        {
            label: '天気.jp', type: 'normal', click: function () {
            spawn("open", [url])
        }
        },
        {
            label: 'Quit', type: 'normal', click: function () {
            app.quit()
        }
        }
    ]);
    appIcon.on('click', function clicked(e, bounds) {
        if(e['ctrlKey']){
            appIcon.popUpContextMenu(contextMenu);
        }
        show_weather();
    });
    appIcon.on('right-click', function clicked(e, bounds) {
        appIcon.popUpContextMenu(contextMenu);
    });
    app.on('before-quit', function (e) {
        // Handle menu-item or keyboard shortcut quit here
        console.log("before-quit");
        force_quit = true;
    });
    scrape();
    setInterval(function () {
        scrape()
    }, 60 * 60 * 1000);

});

app.on('window-all-closed', function () {
    console.log("window-all-closed");
    if (process.platform != 'darwin')
        app.quit();
});


var scrape = function () {
    client.fetch(url, function (err, $, res, body) {
        console.log("scrape");
        var today = {};
        var tommorow = {};
        var today_weather = $($('.forecast_days_weather_telop')[0]).text().replace(/\s/g, '');
        var tommorow_weather = $($('.forecast_days_weather_telop')[1]).text().replace(/\s/g, '');
        if (today_weather.match(/雨/)) {
            appIcon.setImage(__dirname + '/images/rain.png');
        }
        else if (today_weather.match(/雪/)) {
            appIcon.setImage(__dirname + '/images/snow.png');
        }
        else if (today_weather.match(/曇/)) {
            appIcon.setImage(__dirname + '/images/cloud.png');
        }
        else if (today_weather.match(/晴/)) {
            appIcon.setImage(__dirname + '/images/sun.png');
        }

        today['weather'] = today_weather;
        tommorow['weather'] = tommorow_weather;

        today['max'] = $($('.forecast_days_temperature_max_temp_numeric')[0]).text();
        today['min'] = $($('.forecast_days_temperature_min_temp_numeric')[0]).text();

        tommorow['max'] = $($('.forecast_days_temperature_max_temp_numeric')[1]).text();
        tommorow['min'] = $($('.forecast_days_temperature_min_temp_numeric')[1]).text();


        var percents = $('table.forecast_days_precip span.bold');
        var today_percents = [];
        var tommorow_percents = [];

        percents.slice(0, percents.length - 8).each(function () {
            today_percents.push($(this).text());
        });
        appIcon.setTitle(today['max'].toString() + '/' + today['min'].toString() + '/' + Math.max.apply(null, today_percents).toString());
        today['percent'] = today_percents;

        percents.slice(percents.length - 8, percents.length - 4).each(function () {
            tommorow_percents.push($(this).text());
        });
        tommorow['percent'] = tommorow_percents;


        console.log(today);
        console.log(tommorow);


        //forecast_days_temperature_max_temp_numeric

        global.sharedObject = {
            today: today,
            tommorow: tommorow,
        };

    })
};

var show_weather = function () {
    var pos = electron.screen.getCursorScreenPoint();

    let child = new BrowserWindow({
        x: pos['x'] - 150,
        y: pos['y'] - 30,
        width: 200,
        height: 250,
        transparent: true,
        frame: false
    });
    child.loadURL('file://' + __dirname + '/index.html');
    child.once('ready-to-show', () => {
        child.show()
    });
    child.on('blur', function () {
        child.destroy();
    });
    child.on('close', function (e) {
        console.log("close");
        if (!force_quit) {
            e.preventDefault();
            child.hide();
        }
    });


};