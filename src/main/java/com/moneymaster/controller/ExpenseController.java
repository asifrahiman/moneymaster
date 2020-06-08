package com.moneymaster.controller;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

import com.moneymaster.pojo.Expense;
import com.moneymaster.pojo.Response;
import com.moneymaster.repository.ExpenseRepository;

@Controller
@RequestMapping(path = "/moneymaster/expenses")
public class ExpenseController {
	@Autowired
	private ExpenseRepository expenseRepository;
	
	@GetMapping(path = "")
	public @ResponseBody Iterable<Expense> getExpenses(@RequestParam String user,
			@RequestParam(required = false) String startDate, @RequestParam(required = false) String endDate) {
		Date today = new Date();
		Calendar cal = new GregorianCalendar();
		cal.setTime(today);
		cal.add(Calendar.DAY_OF_MONTH, -30);
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
		Date today30 = cal.getTime();
		startDate = startDate == null ? formatter.format(today30) : startDate;
		if (endDate == null)
			return expenseRepository.findUserExpenses(user, startDate);
		else
			return expenseRepository.findUserExpenses(user, startDate,endDate);
	}
	
	@ResponseStatus(HttpStatus.CREATED)
	@PostMapping(path = "")
	public @ResponseBody Expense addExpense(@RequestBody Expense expense)
	{
		expenseRepository.save(expense);
		return expense;
	}
	
	@ResponseStatus(HttpStatus.ACCEPTED)
	@PutMapping(path = "")
	public @ResponseBody Expense updateExpense(@RequestBody Expense expense)
	{
		expenseRepository.save(expense);
		return expense;
	}


	@ResponseStatus(HttpStatus.ACCEPTED)
	@DeleteMapping(path = "{id}")
	public @ResponseBody Response deleteExpense(@PathVariable Integer id) {
		try {
			expenseRepository.deleteById(id);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Type Not Found", e);
		}
		return new Response("Success","DELETE");
	}

	@GetMapping(path = "{id}")
	public @ResponseBody Optional<Expense> getExpense(@PathVariable Integer id) {
		try {
			return expenseRepository.findById(id);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Type Not Found", e);
		}
	}
}
