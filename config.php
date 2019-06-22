<?php
$server="127.0.0.1";
$username="root";
$password="";
$db="moneymaster";
$con=mysqli_connect($server,$username,$password,$db);

// Check connection
if (mysqli_connect_errno())
  {
  echo "Failed to connect to MySQL: " . mysqli_connect_error();
  }
  
?>