package com.moneymaster.pojo;

import java.util.Arrays;
import java.util.List;

public class Scales {
	private List<Axis> xAxes = Arrays.asList(new Axis("Month"));
	private List<Axis> yAxes = Arrays.asList(new Axis("Amount"));

	public List<Axis> getxAxes() {
		return xAxes;
	}

	public void setxAxes(List<Axis> xAxes) {
		this.xAxes = xAxes;
	}

	public List<Axis> getyAxes() {
		return yAxes;
	}

	public void setyAxes(List<Axis> yAxes) {
		this.yAxes = yAxes;
	}

	@Override
	public String toString() {
		return "Scales [xAxes=" + xAxes + ", yAxes=" + yAxes + "]";
	}

}
