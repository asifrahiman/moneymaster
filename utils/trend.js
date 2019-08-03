window.onload = function () {
	var chart = null;
	$.get("utils/trend.php", function(data, status){
		data.legend.itemclick=toggleDataSeries;
		chart = new CanvasJS.Chart("chartContainer", data);
		chart.render();
	});
	function toggleDataSeries(e){
		if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
			e.dataSeries.visible = false;
		}
		else{
			e.dataSeries.visible = true;
		}
		chart.render();
	}
}