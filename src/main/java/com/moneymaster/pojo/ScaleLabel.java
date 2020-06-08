package com.moneymaster.pojo;

public class ScaleLabel {
	private Boolean display = true;
	private String labelString;

	public Boolean getDisplay() {
		return display;
	}

	public void setDisplay(Boolean display) {
		this.display = display;
	}

	public String getLabelString() {
		return labelString;
	}

	public void setLabelString(String labelString) {
		this.labelString = labelString;
	}

	@Override
	public String toString() {
		return "ScaleLabel [display=" + display + ", labelString=" + labelString + "]";
	}

}
