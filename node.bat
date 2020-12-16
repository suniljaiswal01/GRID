cd c:\Grid
java -Dwebdriver.chrome.driver="chromedriver.exe" -jar selenium-server-standalone-3.141.59.jar -role node -hub http://192.168.7.116:4444/grid/register -port 5568
pause