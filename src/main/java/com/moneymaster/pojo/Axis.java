package com.moneymaster.pojo;

public class Axis {
	private Boolean display=true;
	private ScaleLabel scaleLabel=new ScaleLabel();

	public Axis(String label) {
		this.scaleLabel.setLabelString(label);
	}

	public Boolean getDisplay() {
		return display;
	}

	public void setDisplay(Boolean display) {
		this.display = display;
	}

	public ScaleLabel getScaleLabel() {
		return scaleLabel;
	}

	public void setScaleLabel(ScaleLabel scaleLabel) {
		this.scaleLabel = scaleLabel;
	}

	@Override
	public String toString() {
		return "Axis [display=" + display + ", scaleLabel=" + scaleLabel + "]";
	}
	
}
