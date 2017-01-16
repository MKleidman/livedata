var environmentChart;
var scatteringChart;
var globalConfig = {};

var defaultConfig = {
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


function processData(data) {
    var config = $.isEmptyObject(globalConfig) ? defaultConfig : globalConfig;
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

    var environmentDataTypes = ['pressure', 'temperature', 'humidity']
    var scatteringDataTypes = ['rback', 'rforward', 'rcoeff',
                               'gback', 'gforward', 'gcoeff', 'bback', 'bforward', 'bcoeff'];
    var series = { environment: {}, scattering: {} };
    var times = [];
    $.each(environmentDataTypes, function(i, dataType) {
        series.environment[dataType] = [];
    });
    $.each(scatteringDataTypes, function(i, dataType) {
        series.scattering[dataType] = [];
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
        series.environment.pressure.push(pressure);
        series.environment.temperature.push(temperature);
        series.environment.humidity.push(humidity);
        series.scattering.rback.push(back);
        series.scattering.rforward.push(fwd);
        series.scattering.rcoeff.push(rcoeff);
        times.push(Date.parse(TIME));

        sigBack = (BG - D) / (BG_R - BD_R);
        sigFwd = (FG - D) / (FG_R - FD_R);
        back = sigBack * config.aBG + config.bBG - rayleighB(temperature, pressure, "g");
        fwd = sigFwd * config.aFG + config.bFG - rayleighF(temperature, pressure, "g");
        gcoeff = back + fwd;
        series.scattering.gback.push(back);
        series.scattering.gforward.push(fwd);
        series.scattering.gcoeff.push(gcoeff);

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
        series.scattering.bback.push(back);
        series.scattering.bforward.push(fwd);
        series.scattering.bcoeff.push(bcoeff);


    });
    var seriesData;
    var scatteringSeries = $.map(series.scattering, function (val, key) {
        seriesData = [];
        $.each(val, function(index, element) {
            seriesData.push([times[index], element]);
        });
        // hacky way to determine color
        var colorMap = { 'b': 'blue', 'r': 'red', 'g': 'green' };
        return { name: key, data: seriesData, visible: false, lineWidth: 2, turboThreshold: 0, color: colorMap[key[0]] };
    });
    var environmentSeries = $.map(series.environment, function (val, key) {
        seriesData = [];
        $.each(val, function(index, element) {
            seriesData.push([times[index], element]);
        });
        return { name: key, data: seriesData, visible: false, lineWidth: 2, turboThreshold: 0, yAxis: key };
    });
    return { environment: environmentSeries, scattering: scatteringSeries };
}


function generateYAxis(series) {
    var yAxis = $.map(series, function(dataSet) {
        return {
            id: dataSet.name,
            title: {
                text: dataSet.name
            },
            visible: false
        };
    });
    yAxis[0].visible = true;
    return yAxis;
}

function plotScattering(scatteringSeries) {
    scatteringSeries[0].visible = true;
    var scatteringChartConfig = {
        chart: {
            zoomType: 'xy',
            borderWidth: 1,
            borderColor: 'grey'
        },
        exporting: {
            enabled: true,
            fallbackToExportServer: false,
        },
        title: {
            text: 'Real Time Nephelometer (Scattering)'
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
        },
        exporting: {
            enabled: true,
            fallbackToExportServer: false,
        },
        series: scatteringSeries
    };
    scatteringChart = Highcharts.chart('scattering-container', scatteringChartConfig);
}

function plotEnvironment(environmentSeries) {
    var yAxis = generateYAxis(environmentSeries);
    environmentSeries[0].visible = true;
    var environmentChartConfig = {
        chart: {
            zoomType: 'xy',
            borderWidth: 1,
            borderColor: 'grey'
        },
        exporting: {
            enabled: true
        },
        title: {
            text: 'Real Time Nephelometer (Environment)'
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Date'
            }
        },
        yAxis: yAxis,
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
        },
        exporting: {
            enabled: true
        },
        series: environmentSeries
    };
    environmentChart = Highcharts.chart('environment-container', environmentChartConfig);
    $('#environment-container .highcharts-line-series').click(function(e) {
        var axis = environmentChart.yAxis.find(function(axis) {
            return axis.userOptions.id === $(e.currentTarget).find('text')[0].innerHTML;
        });
        axis.update({
            visible: !$(e.currentTarget).hasClass('highcharts-legend-item-hidden')
        });
    });
}

function loadDataOnSuccess(data, status, jqXHR) {
    /* called when backend returns with filedata */
    series = processData(data);

    plotScattering(series.scattering);
    plotEnvironment(series.environment);
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

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function loadDataClicked(e) {
    e.preventDefault();
    $(this).html('Loading...');
    $(this).prop('disabled', true);
    $('#container').html('<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>');
    $.get({
        url: '/loaddata/',
        data: { name: $('#filename-input').select2('data')[0].text, team: 1 },
        success: loadDataOnSuccess,
        error: loadDataOnError
    });
}

function onSelectConfigButtonClick(e) {
    e.preventDefault();
}

function onNewConfigButtonClick(e) {
    e.preventDefault();
    $('.modal-title').html('New Configuration');
    var configInputs = [];
    var config = $.isEmptyObject(globalConfig) ? defaultConfig : globalConfig;
    $.each(config, function(k, v) {
        configInputs.push('<label for="config-input-' + k + '">' + k + ': </label>' +
                          '<input class="form-control config-input" id="config-input-' + k + '" ' +
                          'type="text" name="' + k + '" value="' + v + '">');
    });
    $('.modal-body').append('<form method="POST" enctype="multipart/form-data" id="upload-config-submit"></form>');
    $.each(config, function(k, v) {
        $('#upload-config-submit').append('<div class="form-group" id="config-input-' + k + '"></div>');
        $('#config-input-' + k).append('<label for="config-input-' + k + '">' + k + ': </label>');
        $('#config-input-' + k).append('<input class="form-control config-input" ' +
                                       'type="text" name="' + k + '" value="' + v + '">');
    });
    $('#modal-second-button').html('Save Configuration');
    $('#modal-second-button').removeClass('hidden');
    $('#modal-second-button').click(function(secondSubmitEvent) {
        $('#modal-second-button').html('<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span>');
        $('#modal-second-button').prop('disabled', true);
        $('#global-modal .alert').remove()
        secondSubmitEvent.stopPropagation();
        if (!$('#config-input-name').length) {
            $('#upload-config-submit').append('<div class="form-group has-error" id="config-input-name"></div>');
            $('#config-input-name').append('<label for="config-input-name">Enter Name for Config: </label>');
            $('#config-input-name').append('<input class="form-control config-input" ' +
                                           'type="text" name="name">');
            $('#modal-second-button').prop('disabled', false);
            $('#modal-second-button').html('Save Configuration');
        } else if (!$('#config-input-name input').val()) {
            $('.modal-body').prepend('<div class="alert alert-warning">Enter a Name for Your Config</div>');
            $('#modal-second-button').prop('disabled', false);
            $('#modal-second-button').html('Save Configuration');
        } else {
            var formData = new FormData($('#upload-config-submit')[0]);
            var csrftoken = getCookie('csrftoken');
            formData.append('csrfmiddlewaretoken', csrftoken);
            formData.append('team', 1);  // temporary
            $.post({
                url: 'upload_config/',
                type: 'POST',
                data: formData,
                success: function(data, status, jqXHR) {
                    $('#global-modal').modal('hide');
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    var oldHTML = $('.modal-body').html();
                    $('.modal-body').html('<div class="alert alert-warning">' + jqXHR.responseText + '</div>' + oldHTML);
                    $('#modal-second-button').prop('disabled', false);
                    $('#modal-second-button').html('Save Configuration');
                },
                contentType: false,
                processData: false,
                cache: false
            });
        }
    });
    $('#modal-submit-button').html('Update Configuration');
    $('#modal-submit-button').prop('disabled', false);
    $('#modal-submit-button').click(function(modalSubmitEvent) {
        modalSubmitEvent.preventDefault();
        $('.has-error').removeClass('has-error');
        $('#global-modal .alert').remove()
        $('#modal-submit-button').html('<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span>');
        $('#modal-submit-button').prop('disabled', true);
        var errors = false;
        $('.config-input').each(function(i, input) {
            var val = $(input).val()
            globalConfig[input.name] = parseFloat(val) || val;
            if (isNaN(parseFloat(val))) {
                $(input).parent().addClass('has-error');
                errors = true;
            }
        });

        if (errors) {
            $('.modal-body').prepend('<div class="alert alert-warning">Input Errors. Please Fix and Resubmit</div>');
            $('#modal-submit-button').prop('disabled', false);
            $('#modal-submit-button').html('Update Configuration');
        } else {
            $('.modal-body').empty();
            $('#global-modal').modal('hide');
        }
    });

}

function onUploadDataButtonClick(e) {
    e.preventDefault();
    $('.modal-title').html('Upload Data File');
    $('.modal-body').html(
        '<form method="POST" enctype="multipart/form-data" id="upload-data-submit">' +
        'Filename: <input type="text" name="name">' +
        '<input type="file" name="datafile" id="upload-data-file-input" accept=".csv"></form>'
    );
    $('#modal-submit-button').html('Upload File');
    $('#modal-submit-button').click(function(submitEvent) {

        // remove alerts and set the spinner
        $('#global-modal .alert').remove()
        $('#modal-submit-button').html('<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span>');
        $('#modal-submit-button').prop('disabled', true);

        var formData = new FormData($('#upload-data-submit')[0]);
        var csrftoken = getCookie('csrftoken');
        formData.append('csrfmiddlewaretoken', csrftoken);
        formData.append('team', 1);  // temporary
        submitEvent.preventDefault();
        $.post({
            url: 'upload_data/',
            type: 'POST',
            data: formData,
            success: function(data, status, jqXHR) {
                $('#global-modal').modal('hide');
            },
            error: function(jqXHR, textStatus, errorThrown) {
                var oldHTML = $('.modal-body').html();
                $('.modal-body').html('<div class="alert alert-warning">' + jqXHR.responseText + '</div>' + oldHTML);
                $('#modal-submit-button').prop('disabled', false);
                $('#modal-submit-button').html('Upload File');
            },
            contentType: false,
            processData: false,
            cache: false
        });
    });
}

$(document).ready(function() {
    $('#global-nav-tabs > li > a').click(function(e) {
        e.preventDefault();
        $('.tab-area').hide();
        $('#global-nav-tabs > li').removeClass('active');
        $(e.currentTarget).closest('li').addClass('active');
        $('#' + $(e.currentTarget).data('area')).show();
    });
    $('#loaddata-button').click(loadDataClicked);
    $('#upload_data-button').click(onUploadDataButtonClick);
    $('#new_config-button').click(onNewConfigButtonClick);
    $('#select_config-button').click(onSelectConfigButtonClick);
    $('#filename-input').select2({
        ajax: {
            url: '/list_files/',
            dataType: 'json',
            data: { team: 1 },
            processResults: function (data, params) {
              // parse the results into the format expected by Select2
              var results = $.map(data, function(name, index) { return { id: index + 1, text: name }; });
              if (params.term) {
                results = results.filter(function(result) { return ~result.text.indexOf(params.term); });
              }
              return { results: results };
            },
            minimumInputLength: 1
        }
    });
});

