window.onload = function () {
	var chart = null;
	$.get("utils/trend.php", function(data, status){
		var chart = new CanvasJS.Chart("chartContainer", data);
		chart.render();
	});
}