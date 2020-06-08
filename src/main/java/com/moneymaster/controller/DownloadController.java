package com.moneymaster.controller;

import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.moneymaster.pojo.Download;
import com.moneymaster.pojo.Expense;
import com.moneymaster.pojo.Type;
import com.moneymaster.repository.ExpenseRepository;
import com.moneymaster.repository.TypeRepository;

@Controller
@RequestMapping(path = "/moneymaster/download")
public class DownloadController {

	@Autowired
	TypeRepository typeRepository;
	@Autowired
	ExpenseRepository expenseRepository;

	@GetMapping(path = "")
	public @ResponseBody Download getDownload(@RequestParam String user,
			@RequestParam(required = false) String startDate, @RequestParam(required = false) String endDate) {
		Date today = new Date();
		Calendar cal = new GregorianCalendar();
		cal.setTime(today);
		cal.add(Calendar.DAY_OF_MONTH, -30);
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
		Date today30 = cal.getTime();
		startDate = startDate == null ? formatter.format(today30) : startDate;
		HashMap<String, Double> summary = new HashMap<String, Double>();
		Iterable<Expense> expenses = null;
		Iterable<Type> types = typeRepository.findAll();
		for (Type type : types) {
			String label = type.getType();
			DecimalFormat df = new DecimalFormat("#.##");
			Double expense = null;
			if (endDate == null)
				expense = expenseRepository.findUserTrend1(label, user, startDate);
			else
				expense = expenseRepository.findUserTrend(label, user, startDate, endDate);
			expense = Double.valueOf(df.format(expense == null ? 0 : expense));
			summary.put(label, expense);
		}
		if (endDate == null)
			expenses = expenseRepository.findUserExpenses(user, startDate);
		else
			expenses = expenseRepository.findUserExpenses(user, startDate, endDate);

		return new Download(summary, expenses);
	}
}
