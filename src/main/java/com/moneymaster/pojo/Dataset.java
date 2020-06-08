package com.moneymaster.pojo;

import java.util.ArrayList;

import org.springframework.stereotype.Controller;

public class Dataset {
	private ArrayList<Double> data = new ArrayList<Double>();
	private String label;
	private String backgroundColor;
	private String borderColor;
	private Boolean fill = false;

	public Dataset(String label, String colour) {
		this.label = label;
		this.backgroundColor = colour;
		this.borderColor = colour;
	}

	public ArrayList<Double> getData() {
		return data;
	}

	public void setData(ArrayList<Double> data) {
		this.data = data;
	}

	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}

	public String getBackgroundColor() {
		return backgroundColor;
	}

	public void setBackgroundColor(String backgroundColor) {
		this.backgroundColor = backgroundColor;
	}

	public String getBorderColor() {
		return borderColor;
	}

	public void setBorderColor(String borderColor) {
		this.borderColor = borderColor;
	}

	public Boolean getFill() {
		return fill;
	}

	public void setFill(Boolean fill) {
		this.fill = fill;
	}

	@Override
	public String toString() {
		return "Dataset [data=" + data + ", label=" + label + ", backgroundColor=" + backgroundColor + ", borderColor="
				+ borderColor + ", fill=" + fill + "]";
	}

}
