package com.moneymaster.pojo;

public class Trend {
	private String type = "line";

	private Options options = new Options();
	private Data data;

	public Trend(Data data) {
		this.data=data;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public Options getOptions() {
		return options;
	}

	public void setOptions(Options options) {
		this.options = options;
	}

	public Data getData() {
		return data;
	}

	public void setData(Data data) {
		this.data = data;
	}

	@Override
	public String toString() {
		return "Trend [type=" + type + ", options=" + options + ", data=" + data + "]";
	}

}
