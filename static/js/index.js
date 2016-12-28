function loadConfig() {
    /* default config for now */
    var default_config = {
        "aP" : 1.0, // changed from 1.113 on 2015-06-19
        "aT" : 1.0,
        "aRH" : 1.0,
        "aBR" : 1.0,
        "aFR" : 1.0,
        "aBG" : 1.0,
        "aFG" : 1.0,
        "aBB" : 1.0,
        "aFB" : 1.0,

        "bP" : 0.0,
        "bT" : 0.0,
        "bRH" : 0.0,
        "bBR" : 0.0,
        "bBG" : 0.0,
        "bFR" : 0.0,
        "bFG" : 0.0,
        "bBB" : 0.0,
        "bFB" : 0.0,

        "ar_ratio": 1.0,
        "ag_ratio": 1.0,
        "ab_ratio": 1.0,
        "n2r_ratio": 1.1525,
        "n2g_ratio": 1.1525,
        "n2b_ratio": 1.1525,
        "co2r_ratio": 2.61,
        "co2g_ratio": 2.61,
        "co2b_ratio": 2.61,
        "sf6r_ratio": 6.74,
        "sf6g_ratio": 6.74,
        "sf6b_ratio": 6.74,
        "ar_scat": 0.00000647,
        "ag_scat": 0.0000133,
        "ab_scat": 0.00002459,
        "n2r_scat": 0.0000067773,
        "n2g_scat": 0.000013964,
        "n2b_scat": 0.000025894,

        "co2r_scat": 0.00001674,
        "co2g_scat": 0.00003449,
        "co2b_scat": 0.00006396,
        "sf6r_scat": 0.0000763,
        "sf6g_scat": 0.0000763,
        "sf6b_scat": 0.0000763,
        "ar_btratio": 0.5,
        "ag_btratio": 0.5,
        "ab_btratio": 0.5,
        "n2r_btratio": 0.5,
        "n2g_btratio": 0.5,
        "n2b_btratio": 0.5,
        "co2r_btratio": 0.5,
        "co2g_btratio": 0.5,
        "co2b_btratio": 0.5,
        "sf6r_btratio": 0.5,
        "sf6g_btratio": 0.5,
        "sf6b_btratio": 0.5
    };

    var config = default_config;
    return config;
}

function processData(data) {
    var config = loadConfig();
    var rayleighF = function (t, p, c) {
        var p0 = 101.3;
        var t0 = 293.0;
        

        t += 273.0;
        
        var value = (p / p0) * (t0 / t);
        
        if (c == "r")
            value *= config.ar_scat * (1 - config.ar_btratio);
        else if (c == "g")
            value *= config.ag_scat * (1 - config.ag_btratio);
        else if (c == "b")
            value *= config.ab_scat * (1 - config.ab_btratio);
        
        return value;
    };
    
    var rayleighB = function (t, p, c) {
        var p0 = 101.3;
        var t0 = 293.0;

        t += 273.0;
        
        var value = (p / p0) * (t0 / t);
        
        if (c == "r")
            value *= config.ar_scat * config.ar_btratio;
        else if (c == "g")
            value *= config.ag_scat * config.ag_btratio;
        else if (c == "b")
            value *= config.ab_scat * config.ab_btratio;
        
        return value;
    };

    var dataTypes = ['pressure', 'temperature', 'humidity', 'rback', 'rforward', 'rcoeff',
                 'gback', 'gforward', 'gcoeff', 'bback', 'bforward', 'bcoeff'];
    var series = {};
    var times = [];
    $.each(dataTypes, function(i, dataType) {
        series[dataType] = [];
    });
    $.each(data.split('\n'), function (i, line) {
        try {
            var [serialnumber, TIME, FR, FR_R, FG, FG_R, FB, FB_R, BR, BR_R, BG, BG_R, BB, BB_R, T, P, RH] = line.split(',').slice(0, 17);
        } catch (err) {
            $('#load_log').html('Error parsing data on line ' + (i + 1) + ':' + err);
            return
        }
        var D = 2469684.725  //Vand 12/11/2016 - modified to fix the bug in data transmission for AGU
        var FD_R = 2853729.407  //Vand 12/11/2016 - modified to fix the bug in data transmission for AGU
        var BD_R = 2850252.121  //Vand 12/11/2016 - modified to fix the bug in data transmission for AGU
    
        var pressure = config.aP * P + config.bP;
        var temperature = config.aT * T + config.bT;
        var humidity = config.aRH * RH + config.bRH;
        var sigBack = (BR - D) / (BR_R - BD_R);
        var sigFwd = (FR - D) / (FR_R - FD_R);

        var back = sigBack * config.aBR + config.bBR - rayleighB(temperature, pressure, "r");
        var fwd = sigFwd * config.aFR + config.bFR - rayleighF(temperature, pressure, "r");
        var rcoeff = back + fwd;
        series.pressure.push(pressure);
        series.temperature.push(temperature);
        series.humidity.push(humidity);
        series.rback.push(back);
        series.rforward.push(fwd);
        series.rcoeff.push(rcoeff);
        times.push(Date.parse(TIME));

        sigBack = (BG - D) / (BG_R - BD_R);
        sigFwd = (FG - D) / (FG_R - FD_R);
        back = sigBack * config.aBG + config.bBG - rayleighB(temperature, pressure, "g");
        fwd = sigFwd * config.aFG + config.bFG - rayleighF(temperature, pressure, "g");
        gcoeff = back + fwd;
        series.gback.push(back);
        series.gforward.push(fwd);
        series.gcoeff.push(gcoeff);

        sigBack = (BB - D) / (BB_R - BD_R);
        sigFwd = (FB - D) / (FB_R - FD_R);
        back = sigBack * config.aBB + config.bBB - rayleighB(temperature, pressure, "b");
        fwd = sigFwd * config.aFB + config.bFB - rayleighF(temperature, pressure, "b");
        bcoeff = back + fwd;

        //Vand - Procedure to scale the maximum value of the plot
        //  Must first determine a way to input the max_scale for all colors, total scatt, and backscatt
        //  I am also missing to define the minimum value bellow zero
        //            if max_scale > 0 {
        //            if (bcoeff > max_scale) {
        //                           bcoeff = max_scale
        //                                           }
        //            }
        series.bback.push(back);
        series.bforward.push(fwd);
        series.bcoeff.push(bcoeff);


    });
    return $.map(series, function (val, key) {
        var seriesData = [];
        $.each(val, function(index, element) {
            seriesData.push([times[index], element]);
        });
        return { name: key, data: seriesData, visible: false, lineWidth: 2, turboThreshold: 0 };
    });
}

function loadDataOnSuccess(data, status, jqXHR) {
    /* called when backend returns with filedata */
    var series = processData(data)
    series[0].visible = true;  // set one series initially visible
    Highcharts.chart('container', {
        series: series,
        chart: {
            zoomType: 'x'
        },
        exporting: {
            enabled: true
        },
        title: {
            text: 'Real Time Nephelometer'
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Date'
            }
        },
        legend: {
            layout: 'vertical',
            backgroundColor: '#FFFFFF',
            floating: false,
            align: 'right',
            verticalAlign: 'top'
        },
        tooltip: {
            shared: true,
            crosshairs: true
        }
    });
    $('#loaddata-button').prop('disabled', false);
    $('#loaddata-button').html('Submit');
}

function loadDataOnError(jqXHR, textStatus, errorThrown) {
    $('#loaddata-button').prop('disabled', false);
    $('#loaddata-button').html('Submit');
    if (jqXHR.status === 404) {
        $('#container').html('<h2>Could not find file with name ' + $('#filename-input').val() + '</h2>');
    } else {
        $('#container').html('<h2>Error retrieving file: ' + errorThrown + '</h2>');
    }
}

function loadDataClicked(e) {
    e.preventDefault();
    $(this).html('Loading...');
    $(this).prop('disabled', true);
    $('#container').html('<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>');
    $.post({
        url: '/loaddata/',
        data: { filename: $('#filename-input').val() },
        success: loadDataOnSuccess,
        error: loadDataOnError
    });
}

$(document).ready(function(){
    $('#loaddata-button').click(loadDataClicked);
});
