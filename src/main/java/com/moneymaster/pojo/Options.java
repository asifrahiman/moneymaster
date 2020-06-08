package com.moneymaster.pojo;

public class Options {
	private Boolean responsive = true;
	private Title title = new Title();
	private Tooltips tooltips = new Tooltips("index");
	private Tooltips hover = new Tooltips("nearest");
	private Scales scales=new Scales();

	public Boolean getResponsive() {
		return responsive;
	}

	public void setResponsive(Boolean responsive) {
		this.responsive = responsive;
	}

	public Title getTitle() {
		return title;
	}

	public void setTitle(Title title) {
		this.title = title;
	}

	public Tooltips getTooltips() {
		return tooltips;
	}

	public void setTooltips(Tooltips tooltips) {
		this.tooltips = tooltips;
	}

	public Tooltips getHover() {
		return hover;
	}

	public void setHover(Tooltips hover) {
		this.hover = hover;
	}

	public Scales getScales() {
		return scales;
	}

	public void setScales(Scales scales) {
		this.scales = scales;
	}

	@Override
	public String toString() {
		return "Options [responsive=" + responsive + ", title=" + title + ", tooltips=" + tooltips + ", hover=" + hover
				+ ", scales=" + scales + "]";
	}

}
