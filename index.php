<!DOCTYPE html>
<?php
require 'config.php';
$sel = mysqli_query($con,"SELECT * FROM `users` ORDER BY user");

?>
<html>
<head>
<meta charset="UTF-8">
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Bandwidth Utilisation">
<meta name="author" content="Asif Abdul Rahiman">
<title>Moneymaster</title>
<link rel="shortcut icon" href="utils/favicon.ico" type="image/x-icon">
<link rel="icon" href="utils/favicon.ico" type="image/x-icon">
<link rel="stylesheet" type="text/css" href="utils/mystyle.css">
<link href="utils/bootstrap.min.css" rel="stylesheet">  
<link href="utils/bootstrap-datepicker.css" rel="stylesheet">  
<script src="utils/jquery.js"></script>  
<script src="utils/bootstrap.min.js"></script>  
<script src="utils/bootstrap-datepicker.js"></script> 
<script src="utils/angular.min.js"></script>
</head>


<body class="backc">

<div class="header1">
	
	<div class = "row">
	<div class = "col-sm-1 col-md-2">
	<img src="utils/logo.jpg" class="logo" />
	</div>
	<div class = "col-sm-2 col-md-2">
	<h2 class="title">Moneymaster</h2>
	</div>
	
	<div class = "col-sm-5 col-md-4">
	
	</div>
	<div class = "col-sm-4 col-md-4">
	</div>
	 
	</div>

<div class = "overlay">
	<h2 align = "center">Select your name.</h2>

	<form action="index1.php" method="post" class="">
		<div class = "container-fluid">
			<div class = "row">
	
				<div class = "col-sm-2"></div>
	
				<div class = "col-sm-6">
					<select class="form-control"  name="user">
						<option value="">Select your name</option>
						
						<?php while ($row = mysqli_fetch_array($sel)) {?>
						<option value="<?php echo $row['user']?>"><?php echo $row['user']?></option>
						<?php }?>
					</select>
				</div>
	
				<div class = "col-sm-2">
					<button class="btn btn-block btn-success" type="submit">Login</button>
				</div>
			</div>
		</div>
	</form>
  
</div>
</div>




</body>

</html>
