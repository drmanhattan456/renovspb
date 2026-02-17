
class CityFeaturing():
    def __init__(self, _name: str, _area: float, _population: int,
                 _schools: int, _green_zone_area: float, _child_index=0.3, _treshold: float = 0.5):
        self.name = _name
        self.area = _area
        self.population = _population
        self.schools = _schools
        self.treshold = _treshold
        self.green_zone_area = _green_zone_area
        self.child_index=_child_index

    def get_name(self) -> str:
        '''Получает название города и записывает его в переменную'''
        return self.name
    
    def get_features(self) -> float:
        '''Получает площадь города и население и записывает в переменную'''
        return self.area, self.population
    
    def density_calc(self) -> float:
        '''Получает площадь города и население и записывает в переменную'''
        density =  self.population / self.area
        return density
    
    def provision_calc(self, child_index: float = 0.3, school_index: int = 1000) -> float:
        '''Расчитывает и возвращает обеспечнность города школами
        child_index = 0.3  - дети составляюттреть населения, примерно
        school_index = 1000 - обеспеченность обычно счиатеся на 1000 населения '''
        provision = (school_index  * self.schools) / (child_index * self.population)
        return provision
    
    def is_green_city(self) -> bool:
        '''Определение статуса "Зеленый город" - 
        считаем процент зеленый город и присваимвам True, 
        если процент больше порога. '''
        is_green = True if self.green_zone_area / self.area > self.treshold else False
        return is_green
    
    def print_report(self):
        '''Метод с выводом отчета в виде словаря.'''
        keys_list = ['Название города', 'Площадь города', 'Население города', 
                     'Плотность население', 'Количество школ', 'Обеспеченность школами', 'Зеленый город']
        density = self.density_calc()
        provision = self.provision_calc()
        is_green = self.is_green_city()
        values_list = [self.name, self.area, self.population, density, self.schools, provision, is_green]
        report = dict(zip(keys_list, values_list))
        return report
    
class ResortCity(CityFeaturing):
    def __init__(self, city_name, city_area, city_population, city_schools, city_green_zone_area, annual_tourists, treshold = 0.5, child_index=0.3):
        super().__init__(city_name, city_area, city_population, city_schools, city_green_zone_area, treshold, child_index)
        self.annual_tourists = annual_tourists

    def annual_density_calc(self):
        total_people=self.population+self.annual_tourists
        return total_people/self.area
    
    def tourist_ratio(self):
        return self.annual_tourists/self.population
    
    def resort_report(self):
        report_dict=super().print_report()
        return report_dict

sochi=ResortCity(city_name="Sochi", city_area=350.0, city_population=300000, city_schools=10, city_green_zone_area=150.0, annual_tourists=10000000, treshold=0.5)
print(f'Плотность населения: {sochi.density_calc()}')
print(f'{sochi.name} - зелёный город: {sochi.is_green_city()}')

print(f'Пиковая плотность {sochi.annual_density_calc()}')
print(f'Туристический рейтинг: {sochi.tourist_ratio()}')

class SomeService():
    def __init__(self, name, address, foundation_date, current_date=2026):
        self.name, self.address, self.foundation_date, self.current_date = name, address, foundation_date, current_date 
    
    def info(self):
        print(f'{self.name} построена  {self.current_date-self.foundation_date} лет назад')
    
    def location(self):
        print(f'{self.name} находится по адресу: {self.address}')

hospital = SomeService(name="138 больница", address="ул 10й капельницы, дом 13", foundation_date=1905, current_date=2026)
hospital.info()
hospital.location()

class ServiceCapacity(SomeService):
    def __init__(self, name, address, foundation_date, max_visitors, current_date=2026):
        super().__init__(name, address, foundation_date, current_date)
        self.max_visitors = max_visitors
    
    def capacity(self):
        print(f'{self.name} вмещает {self.max_visitors} людей')


school = ServiceCapacity(name="Школа 7", address="улица Колотушкина дом Пушкина", foundation_date=1980, max_visitors=1000, current_date=2026)
school.capacity()

class SquareIterator():
    def __init__(self,start,end):
        self.current=start
        self.end=end

    def __iter__(self):
        return self
    def __next__(self):
        if self.current>=self.end:
            raise StopIteration
        result = self.current**2
        self.current+=1
        return result

squares=SquareIterator(1,10)
for number in squares:
    print(number)        
 

class EvenIterator():
    def __init__(self,start,end):
        self.current=start
        self.end=end

    def __iter__(self):
        return self
    def __next__(self):
        if self.current>=self.end:
            raise StopIteration
        if self.current%2:
            result = self.current+1
        else:
            result = self.current
        self.current+=2
        return result

evens=EvenIterator(1,10)
for number in evens:
    print(number)       